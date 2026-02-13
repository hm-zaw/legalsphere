import { Kafka, Producer } from "kafkajs";

type CaseNotificationMessage = {
  event_type: "case_notification";
  timestamp: string;
  data: {
    clientId: string;
    caseId: string;
    notificationType: "case_rejected" | "case_assigned" | "case_updated";
    title: string;
    message: string;
    metadata?: unknown;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var _kafkaProducer: Producer | undefined;
  // eslint-disable-next-line no-var
  var _kafkaProducerConnecting: Promise<Producer> | undefined;
}

function getBootstrapServers(): string[] {
  const raw = process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getSecurityConfig() {
  const securityProtocol = process.env.KAFKA_SECURITY_PROTOCOL || "PLAINTEXT";
  const saslMechanism = process.env.KAFKA_SASL_MECHANISM || "PLAIN";
  const username = process.env.KAFKA_USERNAME;
  const password = process.env.KAFKA_PASSWORD;

  // Return undefined for local development (PLAINTEXT)
  if (securityProtocol === "PLAINTEXT") {
    return undefined;
  }

  // Return security config for cloud Kafka (Aiven)
  const config: any = {
    ssl: securityProtocol.includes("SSL"),
  };

  // Add SSL certificates for Aiven
  if (securityProtocol.includes("SSL")) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Read certificate files
      const caPath = process.env.KAFKA_SSL_CA_PATH || "./ca.pem";
      const certPath = process.env.KAFKA_SSL_CERT_PATH || "./service.cert";
      const keyPath = process.env.KAFKA_SSL_KEY_PATH || "./service.key";
      
      const ca = fs.readFileSync(path.resolve(caPath));
      const cert = fs.readFileSync(path.resolve(certPath));
      const key = fs.readFileSync(path.resolve(keyPath));
      
      config.ssl = {
        ca,
        cert,
        key,
        // Important for Aiven: reject unauthorized certificates
        rejectUnauthorized: false,
      };
    } catch (error) {
      console.error("Failed to load SSL certificates:", error);
      throw new Error("SSL certificates not found or invalid");
    }
  }

  if (username && password) {
    config.sasl = {
      mechanism: saslMechanism,
      username,
      password,
    };
  }

  return config;
}

async function getProducer(): Promise<Producer> {
  if (global._kafkaProducer) return global._kafkaProducer;
  if (global._kafkaProducerConnecting) return global._kafkaProducerConnecting;

  global._kafkaProducerConnecting = (async () => {
    const securityConfig = getSecurityConfig();
    
    const kafkaConfig: any = {
      clientId: "legal-sphere-nextjs",
      brokers: getBootstrapServers(),
    };

    // Add security configuration if available
    if (securityConfig) {
      Object.assign(kafkaConfig, securityConfig);
    }

    const kafka = new Kafka(kafkaConfig);

    const producer = kafka.producer();
    await producer.connect();
    global._kafkaProducer = producer;
    return producer;
  })();

  return global._kafkaProducerConnecting;
}

export async function publishCaseNotification(message: CaseNotificationMessage, key?: string): Promise<void> {
  const topic = process.env.KAFKA_CASE_NOTIFICATIONS_TOPIC || "case-notifications";
  const producer = await getProducer();

  const payload = JSON.stringify(message);
  try {
    const res = await producer.send({
      topic,
      messages: [
        {
          key: key || String(message.data.clientId), // Convert to string
          value: payload,
        },
      ],
    });
    // Basic observability: log topic, key, and return metadata
    console.info(
      `Kafka notification published: topic=${topic}, key=${key ?? ""}, bytes=${payload.length}, result=${JSON.stringify(
        res
      )}`
    );
  } catch (err) {
    console.error("Kafka notification publish error:", err);
    throw err;
  }
}
