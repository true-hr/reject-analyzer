// src/components/mcp/McpConnectionPanel.jsx
// Web management panel for PASSMAP pairing-code based connections.
//
// Capabilities:
//   - List the caller's pairings (status, dates).
//   - Mint a 6-char one-time pairing code (1x).
//   - Revoke (soft-delete) any pairing the caller owns.
//
// Security:
//   - Never displays or stores the pmcp_ MCP token. pairing_exchange is
//     performed by the prod wrapper (tools/passmap-mcp-prod-wrapper),
//     not by this panel.
//   - Never shows code_hash / token_hash.
//   - All network calls go through src/lib/mcp/mcpPairingClient.js, which
//     enforces the Vercel API base.

import { useCallback, useEffect, useState } from "react";

import {
  createMcpPairing,
  listMcpPairings,
  revokeMcpPairing,
} from "../../lib/mcp/mcpPairingClient.js";

const CLIENT_NAME = "Claude Desktop";

const STATUS_LABEL = {
  active: "연결됨",
  pending: "코드 발급됨",
  expired: "만료됨",
  revoked: "연결 끊김",
  inactive: "비활성",
};

const STATUS_TONE = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  expired: "bg-slate-50 text-slate-500 border-slate-200",
  revoked: "bg-slate-50 text-slate-400 border-slate-200",
  inactive: "bg-slate-50 text-slate-500 border-slate-200",
};

function formatDateTime(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "-";
  }
}

function StatusBadge({ status }) {
  const key = typeof status === "string" ? status.toLowerCase() : "";
  const label = STATUS_LABEL[key] || `상태: ${status || "알 수 없음"}`;
  const tone = STATUS_TONE[key] || "bg-slate-50 text-slate-500 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function ConfigExampleCard() {
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-slate-700">
        고급 설정 보기
      </summary>
      <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Claude Desktop MCP 설정, 토큰, config 예시는 필요한 경우에만 확인하세요.
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-700">Claude Desktop 설정 예시</div>
      <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Windows 기준 config 경로:{" "}
        <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-700">
          C:\Users\&lt;사용자&gt;\AppData\Roaming\Claude\claude_desktop_config.json
        </code>
        <span className="mt-0.5 block text-slate-400">
          macOS / Linux 등 다른 OS는 Claude Desktop 공식 안내에 따라 경로가 다를 수 있습니다.
        </span>
      </div>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-700">
{`{
  "mcpServers": {
    "passmap-prod": {
      "command": "C:\\\\Program Files\\\\nodejs\\\\node.exe",
      "args": [
        "C:\\\\path\\\\to\\\\reject-analyzer\\\\tools\\\\passmap-mcp-prod-wrapper\\\\server.mjs"
      ],
      "env": {
        "PASSMAP_MCP_TOKEN": "pmcp_...",
        "PASSMAP_API_BASE": "https://reject-analyzer.vercel.app"
      }
    }
  }
}`}
      </pre>
      <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
        <code className="rounded bg-white px-1 py-0.5 text-[11px] text-slate-700">PASSMAP_MCP_TOKEN</code>{" "}
        값은 wrapper 헬퍼 스크립트(pairing_exchange)로 직접 발급해 채워 넣으세요. PASSMAP
        웹에서는 토큰을 직접 보여드리지 않습니다.
      </div>
    </details>
  );
}

export default function McpConnectionPanel({ isLoggedIn = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [createdCode, setCreatedCode] = useState("");
  const [createdExpiresAt, setCreatedExpiresAt] = useState(null);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError("");
    try {
      const data = await listMcpPairings();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err?.message || "연결된 도구를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      refresh();
    } else {
      setItems([]);
      setError("");
      setCreatedCode("");
      setCreatedExpiresAt(null);
    }
  }, [isLoggedIn, refresh]);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    setError("");
    setCreatedCode("");
    setCreatedExpiresAt(null);
    try {
      const data = await createMcpPairing({ clientName: CLIENT_NAME });
      setCreatedCode(String(data.code || ""));
      setCreatedExpiresAt(data.expiresAt || null);
      await refresh();
    } catch (err) {
      setError(err?.message || "연결 코드를 발급하지 못했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(item) {
    if (!item?.id) return;
    if (revokingId) return;
    const ok = window.confirm(
      "이 도구의 PASSMAP 연결을 끊을까요? 기존 업무기록은 삭제되지 않습니다. 이 도구에서 새 기록을 보내려면 다시 연결해야 합니다."
    );
    if (!ok) return;
    setRevokingId(item.id);
    setError("");
    try {
      await revokeMcpPairing({ pairingId: item.id });
      await refresh();
    } catch (err) {
      setError(err?.message || "연결을 끊지 못했습니다.");
    } finally {
      setRevokingId(null);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Claude 연결 관리</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Claude 같은 AI 도구와 PASSMAP을 연결하면 대화 중 업무기록을 바로 저장할 수 있어요.
        </p>
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          로그인 후 Claude 연결을 관리할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Claude 연결 관리</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Claude 같은 AI 도구와 PASSMAP을 연결하면 대화 중 업무기록을 바로 저장할 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "불러오는 중..." : "목록 새로고침"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "발급 중..." : "Claude 연결 코드 만들기"}
        </button>
        <span className="text-[11px] text-slate-500">
          버튼을 누르면 AI 도구에 입력할 6자리 연결 코드가 1회 생성됩니다.
        </span>
      </div>

      {createdCode && (
        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
            새 연결 코드
          </div>
          <div className="mt-1 select-all font-mono text-2xl font-semibold tracking-widest text-violet-900">
            {createdCode}
          </div>
          <div className="mt-1 text-[11px] text-violet-700">
            이 코드는 10분 동안 유효하며 1회만 사용할 수 있습니다. 다른 사람에게 공유하지 마세요.
          </div>
          {createdExpiresAt && (
            <div className="mt-0.5 text-[11px] text-violet-600">
              만료 예정: {formatDateTime(createdExpiresAt)}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          연결된 도구
        </div>
        {loading && items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            목록을 불러오는 중입니다...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            아직 연결된 도구가 없습니다. 위에서 연결 코드를 만들어 주세요.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const statusKey =
                typeof item?.status === "string" ? item.status.toLowerCase() : "";
              const canRevoke = statusKey === "active" || statusKey === "pending";
              const isRevoking = revokingId === item.id;
              return (
                <li
                  key={item.id || `${item.clientName}-${item.createdAt}`}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        {item?.clientName || "이름 없음"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        마지막 사용: {formatDateTime(item?.lastUsedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item?.status} />
                      {canRevoke && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(item)}
                          disabled={isRevoking}
                          className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRevoking ? "연결 끊는 중..." : "연결 끊기"}
                        </button>
                      )}
                    </div>
                  </div>
                  <details className="mt-2 text-[11px] text-slate-500">
                    <summary className="cursor-pointer font-medium text-slate-500">
                      상세 정보 보기
                    </summary>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <div>
                        <dt className="text-slate-400">생성 시각</dt>
                        <dd className="text-slate-700">{formatDateTime(item?.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">연결 시각</dt>
                        <dd className="text-slate-700">{formatDateTime(item?.connectedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">토큰 만료</dt>
                        <dd className="text-slate-700">{formatDateTime(item?.tokenExpiresAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">연결 끊은 시각</dt>
                        <dd className="text-slate-700">{formatDateTime(item?.revokedAt)}</dd>
                      </div>
                    </dl>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfigExampleCard />

      <div className="mt-3 text-[11px] leading-relaxed text-slate-500">
        연결이 안 되면 새 코드를 만들고 Claude에서 다시 연결하세요. 사용하지 않는 도구는 위 목록에서 연결을 끊을 수 있습니다.
      </div>
    </div>
  );
}
