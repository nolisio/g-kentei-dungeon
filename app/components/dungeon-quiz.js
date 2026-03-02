"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  DAMAGE_PER_MISTAKE,
  EXP_PER_CORRECT,
  EXP_PER_RANK,
  MAX_HP,
  QUESTIONS,
} from "../data/questions";

const QUESTION_COUNT = QUESTIONS.length;
const INTRO_LOG = "準備完了。最初の扉の前で待機しています。";

function createInitialGame() {
  return {
    started: false,
    finished: false,
    hp: MAX_HP,
    exp: 0,
    combo: 0,
    cleared: 0,
    currentIndex: 0,
    scanUsed: false,
    locked: false,
    selectedChoice: null,
    logs: [INTRO_LOG],
    resultMessage: "6問突破でダンジョンクリア。HPが尽きたらゲームオーバーです。",
  };
}

function addLog(logs, message) {
  return [message, ...logs].slice(0, 12);
}

function resolveRankTitle(exp, started, finished) {
  if (!started && !finished) {
    return "訓練生";
  }

  if (exp >= 100) {
    return "知識の勇者";
  }

  if (exp >= 60) {
    return "解析士";
  }

  if (exp >= 20) {
    return "探索者";
  }

  return "訓練生";
}

export function DungeonQuiz() {
  const [game, setGame] = useState(createInitialGame);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const currentQuestion =
    game.started && !game.finished ? QUESTIONS[game.currentIndex] : null;
  const hpPercent = Math.max(0, (game.hp / MAX_HP) * 100);
  const expPercent = ((game.exp % EXP_PER_RANK) / EXP_PER_RANK) * 100;
  const floorValue = game.started ? Math.min(game.currentIndex + 1, QUESTION_COUNT) : 0;
  const rankTitle = resolveRankTitle(game.exp, game.started, game.finished);
  const hintText = currentQuestion
    ? game.scanUsed
      ? currentQuestion.hint
      : "まだスキャンしていません。必要なときだけ使ってください。"
    : "ダンジョン開始後、各問題で1回だけ敵の弱点を調べられます。";

  function queueTransition(callback) {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      callback();
    }, 900);
  }

  function startGame() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setGame({
      ...createInitialGame(),
      started: true,
      logs: ["第1層へ突入。最初の敵影を確認。"],
      resultMessage:
        "正解でEXP +20、誤答でHP -20。スキャンは各問題で1回だけ使えます。",
    });
  }

  function advanceToNextFloor() {
    startTransition(() => {
      setGame((current) => ({
        ...current,
        currentIndex: current.currentIndex + 1,
        scanUsed: false,
        locked: false,
        selectedChoice: null,
      }));
    });
  }

  function finishGame(cleared) {
    startTransition(() => {
      setGame((current) => {
        if (cleared) {
          const rank = current.hp >= 80 ? "S" : current.hp >= 60 ? "A" : "B";

          return {
            ...current,
            finished: true,
            locked: true,
            resultMessage: `ダンジョンクリア。残HP ${current.hp}、総EXP ${current.exp}、評価ランク ${rank}。`,
            logs: addLog(
              current.logs,
              `最深部を制覇。最終結果は残HP ${current.hp}、総EXP ${current.exp}。`
            ),
          };
        }

        return {
          ...current,
          finished: true,
          locked: true,
          resultMessage: `ゲームオーバー。到達階層 ${current.currentIndex + 1}、撃破数 ${current.cleared}。`,
          logs: addLog(current.logs, "戦線離脱。知識を補強して再挑戦。"),
        };
      });
    });
  }

  function handleScan() {
    if (!currentQuestion || game.scanUsed || game.locked) {
      return;
    }

    setGame((current) => ({
      ...current,
      scanUsed: true,
      logs: addLog(
        current.logs,
        `${currentQuestion.enemy} をスキャン。弱点情報: ${currentQuestion.hint}`
      ),
    }));
  }

  function handleChoice(choiceIndex) {
    if (!currentQuestion || game.locked || game.finished) {
      return;
    }

    let nextStep = null;

    setGame((current) => {
      if (current.locked || current.finished) {
        return current;
      }

      const question = QUESTIONS[current.currentIndex];
      const correct = choiceIndex === question.answer;
      const next = {
        ...current,
        locked: true,
        selectedChoice: choiceIndex,
      };

      if (correct) {
        next.exp += EXP_PER_CORRECT;
        next.combo += 1;
        next.cleared += 1;
        next.logs = addLog(
          current.logs,
          `${question.enemy} を突破。正解: ${question.explanation} EXP +${EXP_PER_CORRECT} / Combo ${next.combo}`
        );
      } else {
        next.hp = Math.max(0, current.hp - DAMAGE_PER_MISTAKE);
        next.combo = 0;
        next.logs = addLog(
          current.logs,
          `${question.enemy} の反撃で HP -${DAMAGE_PER_MISTAKE}。${question.explanation}`
        );
      }

      if (next.hp === 0) {
        nextStep = () => finishGame(false);
      } else if (next.cleared === QUESTION_COUNT) {
        nextStep = () => finishGame(true);
      } else {
        nextStep = advanceToNextFloor;
      }

      return next;
    });

    if (nextStep) {
      queueTransition(nextStep);
    }
  }

  const stageTitle = currentQuestion
    ? `${currentQuestion.title} / ${currentQuestion.enemy} が立ちはだかっている`
    : game.finished
      ? game.cleared === QUESTION_COUNT
        ? "最深部の扉を突破。ダンジョン制覇。"
        : "HPが尽きたため、冒険はここで終了。"
      : "「冒険を始める」を押すと、G検定ダンジョンの攻略が始まります。";

  const enemyName = currentQuestion
    ? currentQuestion.enemy
    : game.finished
      ? game.cleared === QUESTION_COUNT
        ? "制覇完了"
        : "力尽きた"
      : "未探索の扉";

  const enemyBadge = currentQuestion
    ? currentQuestion.badge
    : game.finished
      ? game.cleared === QUESTION_COUNT
        ? "!"
        : "X"
      : "?";

  const questionText = currentQuestion
    ? currentQuestion.prompt
    : game.finished
      ? game.cleared === QUESTION_COUNT
        ? "もう一度挑戦して、より高いHPとコンボでの完全攻略を狙えます。"
        : "復習して再挑戦すれば、次はさらに深く進めます。"
      : "問題文はここに表示されます。";

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">AI Certification Quest</p>
        <h1>G Kentei Dungeon</h1>
        <p className="hero-copy">
          G検定の知識を、ダンジョン攻略型のクイズで鍛える。正解すれば敵を突破し、
          誤答するとHPが削られる。
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={startGame}
          disabled={game.started && !game.finished}
        >
          {game.started && !game.finished ? "攻略中" : "冒険を始める"}
        </button>
      </header>

      <section className="game-grid">
        <section className="panel status-panel">
          <div className="panel-head">
            <p className="panel-label">Adventurer</p>
            <h2>{rankTitle}</h2>
          </div>

          <div className="stat-block">
            <div className="stat-row">
              <span>HP</span>
              <span>{game.hp} / 100</span>
            </div>
            <div className="meter">
              <div className="meter-fill hp-fill" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          <div className="stat-block">
            <div className="stat-row">
              <span>EXP</span>
              <span>{game.exp}</span>
            </div>
            <div className="meter">
              <div className="meter-fill exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
          </div>

          <div className="mini-stats">
            <article>
              <span className="mini-label">Floor</span>
              <strong>{floorValue}</strong>
            </article>
            <article>
              <span className="mini-label">Combo</span>
              <strong>{game.combo}</strong>
            </article>
            <article>
              <span className="mini-label">Clear</span>
              <strong>
                {game.cleared} / {QUESTION_COUNT}
              </strong>
            </article>
          </div>

          <div className="support-box">
            <p className="support-label">Scan Skill</p>
            <p className="support-copy">{hintText}</p>
            <button
              className="secondary-button"
              type="button"
              onClick={handleScan}
              disabled={!currentQuestion || game.scanUsed || game.locked}
            >
              敵をスキャンする
            </button>
          </div>
        </section>

        <section className="panel battle-panel">
          <div className="panel-head">
            <p className="panel-label">Encounter</p>
            <h2>{enemyName}</h2>
          </div>

          <div className="enemy-stage">
            <div className="enemy-aura" />
            <div className="enemy-core">
              <span>{enemyBadge}</span>
            </div>
          </div>

          <div className="battle-copy">
            <p className="stage-text">{stageTitle}</p>
            <p className="question-text">{questionText}</p>
          </div>

          <div className="choice-list">
            {currentQuestion
              ? currentQuestion.choices.map((choice, index) => {
                  const isCorrect = index === currentQuestion.answer;
                  const isWrong =
                    game.selectedChoice === index && game.selectedChoice !== currentQuestion.answer;

                  let className = "choice-button";

                  if (game.locked && isCorrect) {
                    className += " correct";
                  }

                  if (game.locked && isWrong) {
                    className += " wrong";
                  }

                  return (
                    <button
                      key={choice}
                      className={className}
                      type="button"
                      disabled={game.locked}
                      onClick={() => handleChoice(index)}
                    >
                      {index + 1}. {choice}
                    </button>
                  );
                })
              : null}
          </div>
        </section>

        <section className="panel log-panel">
          <div className="panel-head">
            <p className="panel-label">Log</p>
            <h2>攻略記録</h2>
          </div>

          <div className="log-list" aria-live="polite">
            {game.logs.map((entry, index) => (
              <p className="log-entry" key={`${entry}-${index}`}>
                {entry}
              </p>
            ))}
          </div>

          <div className="result-box">
            <p className="support-label">Result</p>
            <p className="support-copy" aria-live="polite">
              {game.resultMessage}
            </p>
            <button
              className="ghost-button"
              type="button"
              onClick={startGame}
              disabled={!game.finished}
            >
              もう一度挑戦
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
