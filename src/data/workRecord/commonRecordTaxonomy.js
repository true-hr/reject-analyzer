export const COMMON_RECORD_TAXONOMY = {
  collaborationContext: [
    { id: "peer_collaboration", label: "동료", aliases: ["팀원"] },
    { id: "operations_team", label: "운영팀" },
    { id: "customer", label: "고객", aliases: ["사용자", "클라이언트"] },
    { id: "external_partner", label: "외부 파트너", aliases: ["협력사"] },
    { id: "leadership", label: "리더", aliases: ["팀장", "리드"] },
    { id: "cross_functional_team", label: "다른 부서", aliases: ["유관 부서"] },
  ],
  followUpResult: [
    { id: "organized", label: "정리 완료" },
    { id: "follow_up_executed", label: "후속 실행" },
    { id: "sentence_candidate", label: "문장 후보" },
    { id: "workflow_aligned", label: "흐름 정리" },
    { id: "guideline_updated", label: "기준 업데이트" },
    { id: "shared", label: "공유 완료" },
  ],
};
