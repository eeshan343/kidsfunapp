import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface SpiderWebPuzzleProps {
  onNavigate: (page: ModulePage) => void;
}

interface WebNode {
  id: number;
  x: number;
  y: number;
  connected: number[];
  freed: boolean;
}

export default function SpiderWebPuzzle({ onNavigate }: SpiderWebPuzzleProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [level, setLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [nodes, setNodes] = useState<WebNode[]>([]);

  const generateWeb = (levelNum: number) => {
    const nodeCount = 5 + levelNum * 2;
    const newNodes: WebNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: i,
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 300,
        connected: [],
        freed: false,
      });
    }

    // Create connections
    for (let i = 0; i < newNodes.length; i++) {
      const connections = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < connections; j++) {
        const target = Math.floor(Math.random() * newNodes.length);
        if (target !== i && !newNodes[i].connected.includes(target)) {
          newNodes[i].connected.push(target);
          newNodes[target].connected.push(i);
        }
      }
    }

    setNodes(newNodes);
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: generateWeb is stable
  useEffect(() => {
    generateWeb(level);
  }, [level]);

  const handleNodeClick = (nodeId: number) => {
    if (gameOver || gameWon) return;

    if (selectedNode === null) {
      setSelectedNode(nodeId);
    } else {
      // Try to disconnect
      const node1 = nodes.find((n) => n.id === selectedNode);
      const node2 = nodes.find((n) => n.id === nodeId);

      if (node1 && node2 && node1.connected.includes(nodeId)) {
        const newNodes = nodes.map((n) => {
          if (n.id === selectedNode) {
            return { ...n, connected: n.connected.filter((c) => c !== nodeId) };
          }
          if (n.id === nodeId) {
            return {
              ...n,
              connected: n.connected.filter((c) => c !== selectedNode),
            };
          }
          return n;
        });

        setNodes(newNodes);
        setScore((prev) => prev + 10);

        // Check if all nodes are freed
        const allFreed = newNodes.every((n) => n.connected.length === 0);
        if (allFreed) {
          const newScore = score + 110;
          setScore(newScore);
          setHighScore((h) => Math.max(h, newScore));
          if (level >= 3) {
            setGameWon(true);
          } else {
            setTimeout(() => setLevel((prev) => prev + 1), 1000);
          }
        }
      }

      setSelectedNode(null);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setLevel(1);
    setSelectedNode(null);
    generateWeb(1);
  };

  return (
    <GameLayout
      title="Spider Web Puzzle 🕷️"
      score={score}
      highScore={highScore}
      onNavigate={onNavigate}
      onRestart={handleRestart}
      gameOver={gameOver || gameWon}
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center space-y-2">
          <p className="text-2xl text-neon-orange">Level {level}</p>
          <p className="text-lg text-neon-cyan">
            Click two connected nodes to untangle the web!
          </p>
          <p className="text-md text-neon-green">
            Free all monster friends to win!
          </p>
        </div>

        <div className="relative w-full max-w-2xl h-96 bg-gradient-to-br from-purple-900/50 to-black/50 border-4 border-neon-green rounded-lg">
          {/* Draw connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <title>Game graphic</title>
            {nodes.map((node) =>
              node.connected.map((targetId) => {
                const target = nodes.find((n) => n.id === targetId);
                if (!target || targetId < node.id) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#00ff00"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                );
              }),
            )}
          </svg>

          {/* Draw nodes */}
          {nodes.map((node) => (
            <Button
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              className={`absolute w-12 h-12 rounded-full text-2xl ${
                selectedNode === node.id
                  ? "bg-neon-orange border-4 border-neon-cyan"
                  : node.connected.length === 0
                    ? "bg-neon-green border-2 border-white"
                    : "bg-neon-purple border-2 border-neon-pink"
              }`}
              style={{
                left: `${node.x - 24}px`,
                top: `${node.y - 24}px`,
              }}
            >
              {node.connected.length === 0 ? "😊" : "😰"}
            </Button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
