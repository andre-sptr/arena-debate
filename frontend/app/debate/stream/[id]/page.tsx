import StreamDebateClient from "./StreamDebateClient";

interface StreamDebatePageProps {
  params: {
    id: string;
  };
  searchParams: {
    topic?: string;
  };
}

export default function StreamDebatePage({
  params,
  searchParams,
}: StreamDebatePageProps) {
  return (
    <StreamDebateClient
      streamId={params.id}
      topic={searchParams.topic ?? ""}
    />
  );
}
