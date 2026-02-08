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

async function getProducer(): Promise<Producer> {
  if (global._kafkaProducer) return global._kafkaProducer;
  if (global._kafkaProducerConnecting) return global._kafkaProducerConnecting;

  global._kafkaProducerConnecting = (async () => {
    const kafka = new Kafka({
      clientId: "legal-sphere-nextjs",
      brokers: getBootstrapServers(),
    });

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
          key: key || message.data.clientId,
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
