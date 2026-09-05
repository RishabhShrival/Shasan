import { GameClient } from "@/components/game/game-client";

interface GamePageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { roomCode } = await params;
  return <GameClient roomCode={roomCode} />;
}
