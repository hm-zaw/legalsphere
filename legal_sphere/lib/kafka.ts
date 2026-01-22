import { Kafka, Producer } from "kafkajs";

type CaseSubmissionMessage = {
  event_type: "case_submission";
  timestamp: string;
  data: unknown;
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

export async function publishCaseSubmission(message: CaseSubmissionMessage, key?: string): Promise<void> {
  const topic = process.env.KAFKA_CASE_SUBMISSIONS_TOPIC || "case-submissions";
  const producer = await getProducer();

  const payload = JSON.stringify(message);
  try {
    const res = await producer.send({
      topic,
      messages: [
        {
          key,
          value: payload,
        },
      ],
    });
    // Basic observability: log topic, key, and return metadata
    console.info(
      `Kafka published: topic=${topic}, key=${key ?? ""}, bytes=${payload.length}, result=${JSON.stringify(
        res
      )}`
    );
  } catch (err) {
    console.error("Kafka publish error:", err);
    throw err;
  }
}
