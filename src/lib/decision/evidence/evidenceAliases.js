// TOOL_ALIASES: 툴명 정규화 alias (exact match 확장)
export const TOOL_ALIASES = {
  "power bi": ["power bi", "powerbi", "pbi"],
  excel: ["excel", "엑셀", "microsoft excel"],
  sql: ["sql", "mysql", "mssql", "postgresql"],
  sap: ["sap", "sap erp", "erp"],
};

// TASK_ALIASES: 업무 키워드 alias (exact match 확장)
export const TASK_ALIASES = {
  "전략 수립": ["전략 수립", "사업 전략", "중장기 전략", "전략기획", "기획"],
  "데이터 분석": ["데이터 분석", "지표 분석", "성과 분석", "리포팅", "분석"],
  "프로젝트 관리": ["프로젝트 관리", "pm", "일정 관리", "과제 운영"],
  "운영 개선": ["운영 개선", "프로세스 개선", "효율화", "운영 고도화"],
};

// TOOL_SIMILARITY: 유사 툴 partial match (BI / SQL / 스프레드시트 계열)
// 동일 계열 툴이 resume에 있으면 partial로 인정
export const TOOL_SIMILARITY = {
  "power bi": ["tableau", "looker", "metabase", "qlik"],
  powerbi: ["tableau", "looker", "metabase", "qlik"],
  pbi: ["tableau", "looker", "metabase", "qlik"],
  tableau: ["power bi", "powerbi", "looker", "metabase", "qlik"],
  looker: ["power bi", "powerbi", "tableau", "metabase"],
  sql: ["mysql", "postgresql", "mssql", "oracle", "sqlite"],
  mysql: ["sql", "postgresql", "mssql", "oracle"],
  postgresql: ["sql", "mysql", "mssql", "oracle"],
  mssql: ["sql", "mysql", "postgresql"],
  excel: ["google sheets", "구글 스프레드시트", "스프레드시트", "gsheet"],
  엑셀: ["google sheets", "구글 스프레드시트", "스프레드시트", "gsheet"],
  "google sheets": ["excel", "엑셀", "스프레드시트"],
};
