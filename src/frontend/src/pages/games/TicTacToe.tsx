import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ModulePage } from "../../App";

interface TicTacToeProps {
  onNavigate: (page: ModulePage) => void;
}

type Player = "X" | "O" | null;
type GameMode = "pvp" | "ai" | null;
type Board = Player[];

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

export default function TicTacToe({ onNavigate }: TicTacToeProps) {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [isDraw, setIsDraw] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Check for winner
  const checkWinner = (
    currentBoard: Board,
  ): { winner: Player; line: number[] } => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return { winner: currentBoard[a], line: combination };
      }
    }
    return { winner: null, line: [] };
  };

  // Check for draw
  const checkDraw = (currentBoard: Board): boolean => {
    return (
      currentBoard.every((cell) => cell !== null) &&
      !checkWinner(currentBoard).winner
    );
  };

  // AI move logic
  const makeAiMove = (currentBoard: Board) => {
    setIsAiThinking(true);

    setTimeout(() => {
      // Try to win
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          const testBoard = [...currentBoard];
          testBoard[i] = "O";
          if (checkWinner(testBoard).winner === "O") {
            handleCellClick(i, testBoard);
            setIsAiThinking(false);
            return;
          }
        }
      }

      // Try to block player
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          const testBoard = [...currentBoard];
          testBoard[i] = "X";
          if (checkWinner(testBoard).winner === "X") {
            handleCellClick(i, currentBoard);
            setIsAiThinking(false);
            return;
          }
        }
      }

      // Take center if available
      if (currentBoard[4] === null) {
        handleCellClick(4, currentBoard);
        setIsAiThinking(false);
        return;
      }

      // Take a corner
      const corners = [0, 2, 6, 8];
      const availableCorners = corners.filter((i) => currentBoard[i] === null);
      if (availableCorners.length > 0) {
        const randomCorner =
          availableCorners[Math.floor(Math.random() * availableCorners.length)];
        handleCellClick(randomCorner, currentBoard);
        setIsAiThinking(false);
        return;
      }

      // Take any available space
      const availableSpaces = currentBoard
        .map((cell, index) => (cell === null ? index : null))
        .filter((index) => index !== null) as number[];

      if (availableSpaces.length > 0) {
        const randomSpace =
          availableSpaces[Math.floor(Math.random() * availableSpaces.length)];
        handleCellClick(randomSpace, currentBoard);
      }

      setIsAiThinking(false);
    }, 500);
  };

  // Handle cell click
  const handleCellClick = (index: number, currentBoard: Board = board) => {
    if (currentBoard[index] || winner || isDraw || isAiThinking) return;

    const newBoard = [...currentBoard];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const { winner: gameWinner, line } = checkWinner(newBoard);

    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);

      toast.success(`🎉 ${gameWinner} Wins!`, {
        description: gameWinner === "X" ? "Great job!" : "AI wins this round!",
      });
      return;
    }

    if (checkDraw(newBoard)) {
      setIsDraw(true);

      toast.info("It's a Draw!", {
        description: "Well played by both sides!",
      });
      return;
    }

    // Switch player
    const nextPlayer = currentPlayer === "X" ? "O" : "X";
    setCurrentPlayer(nextPlayer);

    // AI move in AI mode
    if (gameMode === "ai" && nextPlayer === "O") {
      makeAiMove(newBoard);
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
    setIsAiThinking(false);
  };

  // Back to mode selection
  const backToModeSelection = () => {
    setGameMode(null);
    resetGame();
  };

  // Mode selection screen
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 flex items-center justify-center">
        <Card className="border-4 border-neon-purple shadow-neon-lg max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigate("games")}
                className="border-3 border-neon-cyan"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-4xl md:text-5xl font-bold text-neon-purple text-shadow-neon-lg">
                Tic Tac Toe
              </CardTitle>
            </div>
            <p className="text-xl text-gray-700 text-center">
              Choose your game mode
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className="border-4 border-neon-pink hover:shadow-neon-lg transition-all cursor-pointer hover:scale-105"
                onClick={() => setGameMode("pvp")}
                onKeyDown={(e) =>
                  e.key === "Enter" && (() => setGameMode("pvp"))
                }
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-6xl">👥</div>
                  <h3 className="text-2xl font-bold text-neon-pink text-shadow-neon-md">
                    Player vs Player
                  </h3>
                  <p className="text-gray-600">
                    Play with a friend on the same device
                  </p>
                </CardContent>
              </Card>

              <Card
                className="border-4 border-neon-green hover:shadow-neon-lg transition-all cursor-pointer hover:scale-105"
                onClick={() => setGameMode("ai")}
                onKeyDown={(e) =>
                  e.key === "Enter" && (() => setGameMode("ai"))
                }
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-6xl">🤖</div>
                  <h3 className="text-2xl font-bold text-neon-green text-shadow-neon-md">
                    Player vs AI
                  </h3>
                  <p className="text-gray-600">
                    Challenge the computer opponent
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-neon-cyan/10 border-4 border-neon-cyan rounded-lg p-6">
              <h4 className="text-xl font-bold text-neon-cyan mb-3 text-shadow-neon-sm">
                How to Play:
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Players take turns placing X or O on the grid</li>
                <li>
                  • Get three in a row (horizontal, vertical, or diagonal) to
                  win
                </li>
                <li>• If all squares are filled with no winner, it's a draw</li>
                <li>• Have fun and play fair! 🎮</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-4 border-neon-purple shadow-neon-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={backToModeSelection}
                  className="border-3 border-neon-cyan"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl md:text-3xl font-bold text-neon-purple text-shadow-neon-md">
                  Tic Tac Toe -{" "}
                  {gameMode === "pvp" ? "Player vs Player" : "Player vs AI"}
                </CardTitle>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={resetGame}
                className="border-3 border-neon-pink"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Game Status */}
        <Card className="border-4 border-neon-green shadow-neon-md">
          <CardContent className="p-6 text-center">
            {winner ? (
              <div className="text-3xl font-bold text-neon-pink text-shadow-neon-lg animate-neon-pulse">
                🎉 {winner} Wins! 🎉
              </div>
            ) : isDraw ? (
              <div className="text-3xl font-bold text-neon-cyan text-shadow-neon-lg">
                It's a Draw! 🤝
              </div>
            ) : isAiThinking ? (
              <div className="text-2xl font-bold text-neon-orange text-shadow-neon-md">
                AI is thinking... 🤔
              </div>
            ) : (
              <div className="text-2xl font-bold text-neon-green text-shadow-neon-md">
                Current Player:{" "}
                <span className="text-neon-purple text-shadow-neon-lg">
                  {currentPlayer}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Board */}
        <Card className="border-4 border-neon-cyan shadow-neon-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {([0, 1, 2, 3, 4, 5, 6, 7, 8] as const).map((pos) => (
                <button
                  type="button"
                  key={pos}
                  onClick={() => handleCellClick(pos)}
                  disabled={!!board[pos] || !!winner || isDraw || isAiThinking}
                  className={`
                    aspect-square text-6xl font-bold rounded-lg border-4 transition-all
                    ${board[pos] === "X" ? "text-neon-pink border-neon-pink bg-neon-pink/10" : ""}
                    ${board[pos] === "O" ? "text-neon-green border-neon-green bg-neon-green/10" : ""}
                    ${!board[pos] ? "border-neon-purple hover:bg-neon-purple/10 hover:border-neon-cyan" : ""}
                    ${winningLine.includes(pos) ? "bg-neon-orange/30 border-neon-orange shadow-neon-lg animate-neon-pulse" : ""}
                    ${!board[pos] && !winner && !isDraw && !isAiThinking ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"}
                    disabled:opacity-50
                  `}
                >
                  {board[pos]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {(winner || isDraw) && (
          <div className="flex gap-4 justify-center">
            <Button
              onClick={resetGame}
              size="lg"
              className="text-xl font-bold h-14 px-8 bg-neon-pink hover:bg-neon-pink/90 border-4 border-neon-purple shadow-neon-md"
            >
              Play Again 🎮
            </Button>
            <Button
              onClick={backToModeSelection}
              variant="outline"
              size="lg"
              className="text-xl font-bold h-14 px-8 border-4 border-neon-cyan"
            >
              Change Mode
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
