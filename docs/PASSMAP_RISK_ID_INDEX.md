# PASSMAP Risk ID Index (SSOT)
PASSMAP Risk ID prefix는 layer가 아니다.

실제 layer 값은 다음 5개만 사용한다.

gate
must
domain
exp
preferred
## CORE 20 (SSOT)
> Engine/UI/Top3/NOTE_TEMPLATES의 기준 목록(최우선 유지).  
> 신규 id 추가는 반드시 CORE 밖에서 시작 → 검증 후 CORE 승격.

- GATE__AGE
- GATE__SALARY_MISMATCH
- GATE__SALARY_DOWNSHIFT
- GATE__HARD_MUST_HAVE_MISSING
- GATE__CRITICAL_EXPERIENCE_GAP
- MUST__SKILL__MISSING
- MUST__TOOL__MISSING_1
- MUST__CERT__MISSING
- DOMAIN__MISMATCH__JOB_FAMILY
- DOMAIN__WEAK__KEYWORD_SPARSE
- ROLE_SKILL__MUST_HAVE_MISSING
- ROLE_SKILL__LOW_SEMANTIC_SIMILARITY
- ROLE_SKILL__JD_KEYWORD_ABSENCE
- IMPACT__NO_QUANTIFIED_IMPACT
- IMPACT__LOW_IMPACT_VERBS
- IMPACT__PROCESS_ONLY
- EXP__SCOPE__TOO_SHALLOW
- EXP__LEADERSHIP__MISSING
- RESUME_STRUCTURE__VAGUE_RESPONSIBILITY_RISK
- RESUME_STRUCTURE__BUZZWORD_RATIO_RISK

## Contract
- riskResults[].id MUST be UPPER_SNAKE with `LAYER__TOPIC(__DETAIL)` format.
- UI/Top3 MUST reference ONLY these IDs (no hyphen ids, no mixed-case ids).
- Non-conforming ids are treated as legacy/internal and MUST NOT appear in riskResults[].id.

## INDEX

### GATE
- GATE__AGE  나이/연령 관련 게이트 신호
- GATE__CRITICAL_EXPERIENCE_GAP  핵심 경력 격차 게이트
- GATE__EDUCATION_GATE_FAIL  학력/학위 요건 게이트 실패
- GATE__HARD_MUST_HAVE_MISSING  필수요건 강제 누락 게이트
- GATE__SALARY_DOWNSHIFT  연봉 다운시프트 게이트
- GATE__SALARY_MISMATCH  연봉/처우 미스매치 게이트

### MUST
- MUST__CERT__MISSING  필수 자격증 누락
- MUST__SKILL__MISSING  필수 스킬 누락
- MUST__TOOL__MISSING_1  필수 툴 누락(1차)

### DOMAIN
- DOMAIN__MISMATCH__JOB_FAMILY  직무 패밀리/도메인 미스매치
- DOMAIN__WEAK__KEYWORD_SPARSE  도메인 근거 키워드 희박

### SENIORITY
- SENIORITY__UNDER_MIN_YEARS  최소 연차 미달

### EXP
- EXP__LEADERSHIP__MISSING  리더십/리딩 경험 부족
- EXP__SCOPE__TOO_SHALLOW  경험 범위/스코프 얕음

### IMPACT
- IMPACT__LOW_IMPACT_VERBS  임팩트 동사 약함
- IMPACT__NO_QUANTIFIED_IMPACT  정량 임팩트 없음
- IMPACT__PROCESS_ONLY  프로세스 나열형

### OWNERSHIP
- OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO  오너십 동사 비율 낮음
- OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL  의사결정 권한 신호 없음
- OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL  프로젝트 주도/발의 신호 없음

### RESUME_STRUCTURE
- RESUME_STRUCTURE__BUZZWORD_RATIO_RISK  버즈워드 비율 리스크
- RESUME_STRUCTURE__GENERIC_SELF_INTRO_RISK  자기소개 일반론 리스크
- RESUME_STRUCTURE__VAGUE_RESPONSIBILITY_RISK  책임/역할 서술 모호

### ROLE_SKILL
- ROLE_SKILL__JD_KEYWORD_ABSENCE  JD 키워드 부재
- ROLE_SKILL__LOW_SEMANTIC_SIMILARITY  의미 유사도 낮음
- ROLE_SKILL__MUST_HAVE_MISSING  역할 핵심요건 누락

### PREF
- PREF__DOMAIN__MATCH  우대 도메인 매칭
- PREF__TOOL__MATCH  우대 툴 매칭

### TOOL
- TOOL__MUST_HAVE_MISSING_V1  툴 필수요건 누락(버전1)

### PRESSURE
- PRESSURE__GATE_BOOST  게이트 압박/가중 신호

### SIMPLE
- SIMPLE__BASELINE_GUIDE  베이스라인 가이드(기본 리스크/가이드)
- SIMPLE__DOMAIN_SHIFT  도메인 전환 리스크
- SIMPLE__ROLE_SHIFT  직무 전환 리스크

## Excluded / Rename candidates (NOT allowed in riskResults[].id)
- explicit_must_lines_only__missing_ge_2 (mixed-case/mixed format)
