import { LobbyClient } from "@/components/lobby/lobby-client";

interface LobbyPageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function LobbyPage({ params }: LobbyPageProps) {
  const { roomCode } = await params;
  return <LobbyClient roomCode={roomCode} />;
}
