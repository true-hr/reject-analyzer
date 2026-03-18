// src/lib/fit/jdResumeFit.js
// ✅ append-only friendly: pure functions, no dependency on analyzer
// 목적: JD 요구사항 vs 이력서 보유사항 "충족/누락" 요약 + warnings 생성

function __norm(s) {
    return String(s || "")
        .toLowerCase()
        .replace(/[\u0000-\u001f]/g, " ")
        .replace(/[^\p{L}\p{N}\+\/\.\-\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function __uniq(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr || []) {
        const k = __norm(x);
        if (!k) continue;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(String(x).trim());
    }
    return out;
}

function __extractBullets(text) {
    const lines = String(text || "").split(/\r?\n/);
    const out = [];
    for (let ln of lines) {
        ln = ln.trim();
        if (!ln) continue;
        // bullet-ish
        if (/^[-*•·]/.test(ln) || /^\d+[.)]/.test(ln)) out.push(ln.replace(/^([-*•·]|\d+[.)])\s*/, ""));
        // short "요구: ..." 같은 한 줄도 넣기
        else if (ln.length <= 120 && /(?:필수|우대|자격|requirements|must|preferred|nice)/i.test(ln)) out.push(ln);
    }
    return out;
}

function __pickSection(text, keys) {
    // 매우 보수적으로: 키워드가 들어간 줄 이후 25줄까지만 수집
    const lines = String(text || "").split(/\r?\n/);
    const keyRe = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");

    const hits = [];
    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (keyRe.test(ln)) {
            for (let j = i; j < Math.min(lines.length, i + 25); j++) hits.push(lines[j]);
        }
    }
    return hits.join("\n");
}

function __extractTokensFromText(text) {
    const t = __norm(text);

    // 자격증/어학/자격명 후보(보수적으로 "잘 알려진 토큰 + 패턴" 위주)
    const certPatterns = [
        /\bpmp\b/g,
        /\bcpsm\b/g,
        /\bcpim\b/g,
        /\bcsmp\b/g,
        /\bsqld\b/g,
        /\bsqldp\b/g,
        /\bop(ic|i)\b/g,
        /\btoeic\b/g,
        /\btoefl\b/g,
        /\bies?ts\b/g,
        /\bgre\b/g,
        /\bgmat\b/g,
        /\baws\b/g,
        /\bazure\b/g,
        /\bgcp\b/g,
        /\bsap\b/g, // 툴이지만 JD에선 자격처럼 걸리는 경우가 많음
    ];

    const toolPatterns = [
        /\bsap\b/g,
        /\berp\b/g,
        /\bexcel\b/g,
        /\bpower\s*bi\b/g,
        /\btableau\b/g,
        /\bpython\b/g,
        /\bsql\b/g,
        /\bjira\b/g,
        /\bconfluence\b/g,
        /\bgit\b/g,
        /\bnotion\b/g,
        /\bslack\b/g,
    ];

    const eduPatterns = [
        /(학사|석사|박사)/g,
        /\bmba\b/g,
        /(전공|공학|상경|경영|경제|통계|산업공학|컴퓨터|데이터)/g,
    ];

    const certs = [];
    for (const re of certPatterns) {
        const m = t.match(re);
        if (m) certs.push(...m);
    }

    const tools = [];
    for (const re of toolPatterns) {
        const m = t.match(re);
        if (m) tools.push(...m);
    }

    const education = [];
    for (const re of eduPatterns) {
        const m = t.match(re);
        if (m) education.push(...m);
    }

    return {
        certs: __uniq(certs),
        tools: __uniq(tools),
        education: __uniq(education),
    };
}

function __extractResumeHints(text) {
    const raw = String(text || "");
    const t = __norm(raw);

    // 프로젝트 힌트(너무 공격적이면 오탐이 많아서 "프로젝트/PoC/구축/리드" 정도만)
    const projectHits = [];
    const projLines = raw.split(/\r?\n/).filter(l => /(프로젝트|poc|구축|전환|리드|런칭|개선)\b/i.test(l));
    for (const l of projLines.slice(0, 12)) projectHits.push(l.trim());

    // 연봉 힌트(숫자+만원/원/연봉/희망연봉)
    let salaryHint = null;
    {
        const m =
            raw.match(/(희망\s*연봉|연봉)\s*[:\-]?\s*([0-9][0-9,.\s]{2,})\s*(만원|원)?/i) ||
            raw.match(/([0-9][0-9,.\s]{2,})\s*(만원|원)\s*(?:수준|희망|연봉)?/i);
        if (m) salaryHint = (m[0] || "").trim();
    }

    // 나이 힌트(생년/19xx/20xx/만 xx세)
    let ageHint = null;
    {
        const m =
            raw.match(/(생년|출생)\s*[:\-]?\s*(19\d{2}|20\d{2})/i) ||
            raw.match(/\b(19\d{2}|20\d{2})\b/) ||
            raw.match(/만\s*\d{2}\s*세/);
        if (m) ageHint = (m[0] || "").trim();
    }

    const base = __extractTokensFromText(raw);
    return {
        ...base,
        projectsSample: __uniq(projectHits),
        salaryHint,
        ageHint,
    };
}

function __splitNonEmptyLines(text) {
    return String(text || "")
        .split(/\r?\n/)
        .map((line) => String(line || "").trim())
        .filter(Boolean);
}

function __normalizeSectionHeader(line) {
    return String(line || "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[:：]\s*$/, "")
        .toLowerCase();
}

function __normalizeBulletLikeLine(line) {
    return String(line || "")
        .replace(/^[\-\*\•\·\u2022]+\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();
}

function __dedupeKeepOrder(lines, max = 20) {
    const out = [];
    const seen = new Set();
    for (const line of Array.isArray(lines) ? lines : []) {
        const text = String(line || "").trim();
        if (!text) continue;
        const key = __norm(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(text);
        if (out.length >= max) break;
    }
    return out;
}

function __collectSectionLines(rawText, { headerPatterns = [], stopPatterns = [], maxLines = 20 } = {}) {
    const lines = __splitNonEmptyLines(rawText);
    const out = [];
    let active = false;

    for (const line of lines) {
        const normalized = __normalizeSectionHeader(line);
        const isHeader = headerPatterns.some((re) => re.test(normalized));
        const isStop = stopPatterns.some((re) => re.test(normalized));

        if (isHeader) {
            active = true;
            const tail = String(line || "").split(/[:：]/).slice(1).join(":").trim();
            if (tail) out.push(tail);
            continue;
        }
        if (!active) continue;
        if (isStop) break;

        out.push(line);
        if (out.length >= maxLines) break;
    }

    return out;
}

function __extractJdDomainKeywords(rawText) {
    const text = String(rawText || "");
    const __structuredKeywordsV3 = __extractJdDomainKeywordsStructuredV3(text);
    if (__structuredKeywordsV3.length) return __structuredKeywordsV3;
    const __structuredKeywords = __extractJdDomainKeywordsStructured(text);
    if (__structuredKeywords.length) return __structuredKeywords;
    if (!text.trim()) return [];
    if (/[가-힣]/.test(text)) {
        return __dedupeKeepOrder([
            /hrbp|hr\s*business\s*partner/i.test(text) ? "HRBP" : "",
            /hr\s*전략|인사\s*전략/i.test(text) ? "HR 전략" : "",
            /조직\s*진단/i.test(text) ? "조직 진단" : "",
            /인력\s*운영\s*전략|인력\s*전략|workforce\s*planning|headcount\s*planning/i.test(text) ? "인력 전략" : "",
            /조직\s*구조|조직\s*설계|org\s*design/i.test(text) ? "조직 구조" : "",
            /성과\s*관리|performance\s*management/i.test(text) ? "성과관리" : "",
            /보상|compensation|total\s*rewards/i.test(text) ? "보상" : "",
            /직원\s*관계|employee\s*relations|\ber\b/i.test(text) ? "직원 관계" : "",
            /조직\s*이슈\s*대응|grievance|labor\s*relations/i.test(text) ? "조직 이슈 대응" : "",
            /hris|hr\s*데이터|인사\s*데이터|people\s*analytics/i.test(text) ? "HR 데이터" : "",
        ], 8);
    }
    const buckets = [
        { key: "hrbp", re: /\bhrbp\b|hr\s*business\s*partner/i },
        { key: "hr 전략", re: /hr\s*전략|인사\s*전략/i },
        { key: "조직 진단", re: /조직\s*진단/i },
        { key: "인력 전략", re: /인력\s*운영\s*전략|인력\s*전략|workforce\s*planning|headcount\s*planning/i },
        { key: "조직 구조", re: /조직\s*구조|조직\s*설계|org\s*design/i },
        { key: "성과관리", re: /성과\s*관리|performance\s*management/i },
        { key: "보상", re: /보상|compensation|total\s*rewards/i },
        { key: "직원 관계", re: /직원\s*관계|employee\s*relations|\ber\b/i },
        { key: "조직 이슈 대응", re: /조직\s*이슈\s*대응|grievance|labor\s*relations/i },
        { key: "hr 데이터", re: /hris|hr\s*데이터|인사\s*데이터|people\s*analytics/i },
    ];
    return buckets.filter((entry) => entry.re.test(text)).map((entry) => entry.key).slice(0, 8);
}

const __JD_SECTION_HEADERS_V2 = {
    responsibilities: [
        "주요 업무",
        "주요업무",
        "담당 업무",
        "담당업무",
        "주요 역할",
        "업무 내용",
        "업무소개",
        "이런 일을 합니다",
        "roles & responsibilities",
        "responsibilities",
        "duties",
        "what you will do",
    ],
    must: [
        "자격 요건",
        "자격요건",
        "지원 자격",
        "지원자격",
        "필수 요건",
        "필수요건",
        "필수",
        "requirements",
        "required",
        "must",
        "qualifications",
        "required skills",
    ],
    preferred: [
        "우대 사항",
        "우대사항",
        "우대 요건",
        "우대요건",
        "우대",
        "preferred",
        "nice to have",
        "good to have",
        "plus",
        "bonus",
    ],
};

function __normalizeJdHeaderV2(line) {
    return String(line || "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[：:]+$/u, "")
        .toLowerCase();
}

function __stripBulletLineV2(line) {
    return String(line || "")
        .replace(/^[\-\*\u2022\u25E6\u2023\u2219▪◦·]+\s*/u, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();
}

function __findSectionHeaderMatchV2(line, headers) {
    const normalized = __normalizeJdHeaderV2(line);
    for (const header of headers) {
        const h = __normalizeJdHeaderV2(header);
        if (!h) continue;
        if (normalized === h) return header;
        if (normalized.startsWith(`${h}:`)) return header;
        if (normalized.startsWith(`${h} :`)) return header;
        if (normalized.startsWith(`${h}：`)) return header;
    }
    return null;
}

function __extractSectionTailV2(line, matchedHeader) {
    if (!matchedHeader) return "";
    const source = String(line || "").trim();
    const escaped = String(matchedHeader || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^\\s*${escaped}\\s*[：:]?\\s*(.*)$`, "iu");
    const m = source.match(re);
    return m ? String(m[1] || "").trim() : "";
}

function __collectSectionLinesV2(rawText, kind, maxLines = 20) {
    const lines = __splitNonEmptyLines(rawText);
    const headers = Array.isArray(__JD_SECTION_HEADERS_V2[kind]) ? __JD_SECTION_HEADERS_V2[kind] : [];
    const allHeaders = [
        ...__JD_SECTION_HEADERS_V2.responsibilities,
        ...__JD_SECTION_HEADERS_V2.must,
        ...__JD_SECTION_HEADERS_V2.preferred,
    ];
    const out = [];
    let active = false;

    for (const line of lines) {
        const ownHeader = __findSectionHeaderMatchV2(line, headers);
        const anyHeader = __findSectionHeaderMatchV2(line, allHeaders);
        if (ownHeader) {
            active = true;
            const tail = __stripBulletLineV2(__extractSectionTailV2(line, ownHeader));
            if (tail) out.push(tail);
            continue;
        }
        if (!active) continue;
        if (anyHeader) break;
        const cleaned = __stripBulletLineV2(line);
        if (!cleaned || cleaned.length < 2) continue;
        out.push(cleaned);
        if (out.length >= maxLines) break;
    }

    return __dedupeKeepOrder(out, maxLines);
}

function __extractStructuredJdRequirementsV2(rawText) {
    const mustLines = __collectSectionLinesV2(rawText, "must", 24).filter((line) => line.length >= 4);
    const prefLines = __collectSectionLinesV2(rawText, "preferred", 20).filter((line) => line.length >= 4);
    return {
        mustLines,
        prefLines,
    };
}

function __extractJdYearsRequiredStructured(rawText) {
    const lines = [
        ...__collectSectionLinesV2(rawText, "must", 24),
        ...__splitNonEmptyLines(rawText),
    ];
    for (const line of lines) {
        const range = line.match(/(\d{1,2})\s*년\s*[~\-]\s*(\d{1,2})\s*년/u);
        if (range) {
            const min = __toInt(range[1]);
            const max = __toInt(range[2]);
            if (min && max && min <= max) {
                return { min, max, confidence: 0.92, raw: line, note: /우대|preferred|nice/i.test(line) ? "nice" : "must" };
            }
        }
        const minMatch = line.match(/(\d{1,2})\s*년\s*이상/u);
        if (minMatch) {
            const min = __toInt(minMatch[1]);
            if (min) {
                return { min, max: null, confidence: 0.94, raw: line, note: /우대|preferred|nice/i.test(line) ? "nice" : "must" };
            }
        }
    }
    return null;
}

function __extractJdDomainKeywordsStructured(rawText) {
    const text = String(rawText || "");
    if (!text.trim()) return [];
    return __dedupeKeepOrder([
        /hrbp|hr\s*business\s*partner/i.test(text) ? "HRBP" : "",
        /hr\s*전략|인사\s*전략/i.test(text) ? "HR 전략" : "",
        /조직\s*진단/i.test(text) ? "조직 진단" : "",
        /인력\s*운영\s*전략|인력\s*전략|workforce\s*planning|headcount\s*planning/i.test(text) ? "인력 전략" : "",
        /조직\s*구조|조직\s*설계|org\s*design/i.test(text) ? "조직 구조" : "",
        /성과\s*관리|performance\s*management/i.test(text) ? "성과관리" : "",
        /보상|compensation|total\s*rewards/i.test(text) ? "보상" : "",
        /직원\s*관계|employee\s*relations|\ber\b/i.test(text) ? "직원 관계" : "",
        /조직\s*이슈\s*대응|grievance|labor\s*relations/i.test(text) ? "조직 이슈 대응" : "",
        /hris|hr\s*데이터|인사\s*데이터|people\s*analytics/i.test(text) ? "HR 데이터" : "",
    ], 10);
}

function __extractJdResponsibilitiesStructuredV2(rawText) {
    return __collectSectionLinesV2(rawText, "responsibilities", 18)
        .filter((line) => line.length >= 8)
        .slice(0, 15);
}

const __JD_SECTION_HEADERS_V3 = {
    responsibilities: [
        "\uC8FC\uC694 \uC5C5\uBB34",
        "\uC8FC\uC694\uC5C5\uBB34",
        "\uB2F4\uB2F9 \uC5C5\uBB34",
        "\uB2F4\uB2F9\uC5C5\uBB34",
        "\uC8FC\uC694 \uC5ED\uD560",
        "\uC5C5\uBB34 \uB0B4\uC6A9",
        "\uC5C5\uBB34\uC18C\uAC1C",
        "\uC774\uB7F0 \uC77C\uC744 \uD569\uB2C8\uB2E4",
        "roles & responsibilities",
        "responsibilities",
        "duties",
        "what you will do",
    ],
    must: [
        "\uC790\uACA9 \uC694\uAC74",
        "\uC790\uACA9\uC694\uAC74",
        "\uC9C0\uC6D0 \uC790\uACA9",
        "\uC9C0\uC6D0\uC790\uACA9",
        "\uD544\uC218 \uC694\uAC74",
        "\uD544\uC218\uC694\uAC74",
        "\uD544\uC218",
        "requirements",
        "required",
        "must",
        "qualifications",
        "required skills",
    ],
    preferred: [
        "\uC6B0\uB300 \uC0AC\uD56D",
        "\uC6B0\uB300\uC0AC\uD56D",
        "\uC6B0\uB300 \uC694\uAC74",
        "\uC6B0\uB300\uC694\uAC74",
        "\uC6B0\uB300",
        "preferred",
        "nice to have",
        "good to have",
        "plus",
        "bonus",
    ],
};

function __normalizeJdHeaderV3(line) {
    return String(line || "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[：:]+$/u, "")
        .toLowerCase();
}

function __stripBulletLineV3(line) {
    return String(line || "")
        .replace(/^[\-\*\u2022\u25E6\u2023\u2219▪◦·]+\s*/u, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim();
}

function __findSectionHeaderMatchV3(line, headers) {
    const normalized = __normalizeJdHeaderV3(line);
    for (const header of headers) {
        const h = __normalizeJdHeaderV3(header);
        if (!h) continue;
        if (normalized === h) return header;
        if (normalized.startsWith(`${h}:`)) return header;
        if (normalized.startsWith(`${h} :`)) return header;
        if (normalized.startsWith(`${h}：`)) return header;
    }
    return null;
}

function __extractSectionTailV3(line, matchedHeader) {
    if (!matchedHeader) return "";
    const source = String(line || "").trim();
    const escaped = String(matchedHeader || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^\\s*${escaped}\\s*[：:]?\\s*(.*)$`, "iu");
    const m = source.match(re);
    return m ? String(m[1] || "").trim() : "";
}

function __collectSectionLinesV3(rawText, kind, maxLines = 20) {
    const lines = __splitNonEmptyLines(rawText);
    const headers = Array.isArray(__JD_SECTION_HEADERS_V3[kind]) ? __JD_SECTION_HEADERS_V3[kind] : [];
    const allHeaders = [
        ...__JD_SECTION_HEADERS_V3.responsibilities,
        ...__JD_SECTION_HEADERS_V3.must,
        ...__JD_SECTION_HEADERS_V3.preferred,
    ];
    const out = [];
    let active = false;

    for (const line of lines) {
        const ownHeader = __findSectionHeaderMatchV3(line, headers);
        const anyHeader = __findSectionHeaderMatchV3(line, allHeaders);
        if (ownHeader) {
            active = true;
            const tail = __stripBulletLineV3(__extractSectionTailV3(line, ownHeader));
            if (tail) out.push(tail);
            continue;
        }
        if (!active) continue;
        if (anyHeader) break;
        const cleaned = __stripBulletLineV3(line);
        if (!cleaned || cleaned.length < 2) continue;
        out.push(cleaned);
        if (out.length >= maxLines) break;
    }

    return __dedupeKeepOrder(out, maxLines);
}

function __extractStructuredJdRequirementsV3(rawText) {
    return {
        mustLines: __collectSectionLinesV3(rawText, "must", 24).filter((line) => line.length >= 4),
        prefLines: __collectSectionLinesV3(rawText, "preferred", 20).filter((line) => line.length >= 4),
    };
}

function __extractJdYearsRequiredStructuredV3(rawText) {
    const lines = [
        ...__collectSectionLinesV3(rawText, "must", 24),
        ...__splitNonEmptyLines(rawText),
    ];
    for (const line of lines) {
        const range = line.match(/(\d{1,2})\s*\uB144\s*[~\-]\s*(\d{1,2})\s*\uB144/u);
        if (range) {
            const min = __toInt(range[1]);
            const max = __toInt(range[2]);
            if (min && max && min <= max) {
                return { min, max, confidence: 0.92, raw: line, note: /preferred|nice|\uC6B0\uB300/i.test(line) ? "nice" : "must" };
            }
        }
        const minMatch = line.match(/(\d{1,2})\s*\uB144\s*\uC774\uC0C1/u);
        if (minMatch) {
            const min = __toInt(minMatch[1]);
            if (min) {
                return { min, max: null, confidence: 0.94, raw: line, note: /preferred|nice|\uC6B0\uB300/i.test(line) ? "nice" : "must" };
            }
        }
    }
    return null;
}

function __extractJdDomainKeywordsStructuredV3(rawText) {
    const text = String(rawText || "");
    if (!text.trim()) return [];
    return __dedupeKeepOrder([
        /hrbp|hr\s*business\s*partner/i.test(text) ? "HRBP" : "",
        /hr\s*\uC804\uB7B5|\uC778\uC0AC\s*\uC804\uB7B5/i.test(text) ? "\u0048\u0052 \uC804\uB7B5" : "",
        /\uC870\uC9C1\s*\uC9C4\uB2E8/i.test(text) ? "\uC870\uC9C1 \uC9C4\uB2E8" : "",
        /\uC778\uB825\s*\uC6B4\uC601\s*\uC804\uB7B5|\uC778\uB825\s*\uC804\uB7B5|workforce\s*planning|headcount\s*planning/i.test(text) ? "\uC778\uB825 \uC804\uB7B5" : "",
        /\uC870\uC9C1\s*\uAD6C\uC870|\uC870\uC9C1\s*\uC124\uACC4|org\s*design/i.test(text) ? "\uC870\uC9C1 \uAD6C\uC870" : "",
        /\uC131\uACFC\s*\uAD00\uB9AC|performance\s*management/i.test(text) ? "\uC131\uACFC\uAD00\uB9AC" : "",
        /\uBCF4\uC0C1|compensation|total\s*rewards/i.test(text) ? "\uBCF4\uC0C1" : "",
        /\uC9C1\uC6D0\s*\uAD00\uACC4|employee\s*relations|\ber\b/i.test(text) ? "\uC9C1\uC6D0 \uAD00\uACC4" : "",
        /\uC870\uC9C1\s*\uC774\uC288\s*\uB300\uC751|grievance|labor\s*relations/i.test(text) ? "\uC870\uC9C1 \uC774\uC288 \uB300\uC751" : "",
        /hris|hr\s*\uB370\uC774\uD130|\uC778\uC0AC\s*\uB370\uC774\uD130|people\s*analytics/i.test(text) ? "\u0048\u0052 \uB370\uC774\uD130" : "",
    ], 10);
}

function __extractJdResponsibilitiesStructuredV3(rawText) {
    return __collectSectionLinesV3(rawText, "responsibilities", 18)
        .filter((line) => line.length >= 8)
        .slice(0, 15);
}

function __extractJdRequirements(jdText) {
    const raw = String(jdText || "");
    const __structuredReqV2 = __extractStructuredJdRequirementsV2(raw);
    const __structuredReqV3 = __extractStructuredJdRequirementsV3(raw);
    const __sectionHeaderKeysV3 = new Set([
        ...__JD_SECTION_HEADERS_V3.must,
        ...__JD_SECTION_HEADERS_V3.preferred,
    ].map((line) => __normalizeJdHeaderV3(line)));
    const __mustSectionLines = __collectSectionLines(raw, {
        headerPatterns: [
            /^(자격 요건|자격요건|지원 자격|지원자격|필수 요건|필수요건|requirements|required|must|qualifications|required skills)$/i,
        ],
        stopPatterns: [
            /^(주요 업무|주요업무|담당 업무|담당업무|responsibilities|duties|what you will do|직무|포지션|job title)$/i,
            /^(우대 사항|우대사항|preferred|nice to have|plus)$/i,
        ],
        maxLines: 24,
    });
    const __prefSectionLines = __collectSectionLines(raw, {
        headerPatterns: [
            /^(우대 사항|우대사항|preferred|nice to have|plus)$/i,
        ],
        stopPatterns: [
            /^(주요 업무|주요업무|담당 업무|담당업무|responsibilities|duties|what you will do|직무|포지션|job title)$/i,
            /^(자격 요건|자격요건|지원 자격|지원자격|필수 요건|필수요건|requirements|required|must|qualifications)$/i,
        ],
        maxLines: 20,
    });

    // 기존: 섹션 헤더 기반 (있으면 이게 가장 정확)
    const mustSection = __pickSection(raw, [
        "자격요건",
        "필수",
        "requirements",
        "must",
        "필수요건",
        "자격 요건",
        "지원자격",
        "required",
        "qualifications",
        "required skills",
        "필수역량",
    ]);
    const prefSection = __pickSection(raw, [
        "우대",
        "preferred",
        "nice to have",
        "우대사항",
        "우대 요건",
        "우대역량",
    ]);

    let mustBullets = __extractBullets(mustSection);
    let prefBullets = __extractBullets(prefSection);
    if (__mustSectionLines.length > 0) {
        mustBullets = __dedupeKeepOrder([
            ...mustBullets,
            ...__mustSectionLines.map((line) => __normalizeBulletLikeLine(line)),
            ...__structuredReqV2.mustLines,
            ...__structuredReqV3.mustLines,
        ], 20);
    }
    if (__mustSectionLines.length === 0 && __structuredReqV2.mustLines.length > 0) {
        mustBullets = __dedupeKeepOrder([
            ...mustBullets,
            ...__structuredReqV2.mustLines,
        ], 20);
    }
    if (__mustSectionLines.length === 0 && __structuredReqV3.mustLines.length > 0) {
        mustBullets = __dedupeKeepOrder([
            ...mustBullets,
            ...__structuredReqV3.mustLines,
        ], 20);
    }
    if (__prefSectionLines.length > 0) {
        prefBullets = __dedupeKeepOrder([
            ...prefBullets,
            ...__prefSectionLines.map((line) => __normalizeBulletLikeLine(line)),
            ...__structuredReqV2.prefLines,
            ...__structuredReqV3.prefLines,
        ], 16);
    }
    if (__prefSectionLines.length === 0 && __structuredReqV2.prefLines.length > 0) {
        prefBullets = __dedupeKeepOrder([
            ...prefBullets,
            ...__structuredReqV2.prefLines,
        ], 16);
    }
    if (__prefSectionLines.length === 0 && __structuredReqV3.prefLines.length > 0) {
        prefBullets = __dedupeKeepOrder([
            ...prefBullets,
            ...__structuredReqV3.prefLines,
        ], 16);
    }

    // ✅ PATCH ROUND 6 (append-only): 섹션 헤더 단문을 requiredLines에서 제외
    // __pickSection이 헤더 라인 자체도 수집하므로 mustBullets에서 필터
    const __REQ_HEADER_SET = new Set([
        "자격요건", "필수요건", "지원자격", "필수역량", "필수",
        "requirements", "required", "required skills", "qualifications", "must", "must have",
        "우대", "우대사항", "우대 요건", "우대역량", "preferred", "nice to have",
    ]);
    function __isReqHeaderLine(s) {
        const n = String(s || "").trim().replace(/:$/, "").trim().toLowerCase();
        return __REQ_HEADER_SET.has(n);
    }
    mustBullets = mustBullets.filter((s) => !__isReqHeaderLine(s));
    prefBullets = prefBullets.filter((s) => !__isReqHeaderLine(s));
    mustBullets = mustBullets.filter((s) => !__sectionHeaderKeysV3.has(__normalizeJdHeaderV3(s)));
    prefBullets = prefBullets.filter((s) => !__sectionHeaderKeysV3.has(__normalizeJdHeaderV3(s)));

    // ✅ fallback: 섹션이 비었으면 JD 전체에서 "요구 신호" 라인만 모으기
    try {
        const needRe =
            /(필수|우대|requirements?|required|must|preferred|nice|자격|지원자격|역량|experience|경험|사용|가능|이상|보유|숙련)/i;

        const lines = raw
            .split(/\r?\n/)
            .map((l) => String(l || "").trim())
            .filter(Boolean);

        if (!mustBullets.length) {
            const picked = lines.filter((l) => needRe.test(l)).slice(0, 40);
            mustBullets = __dedupeKeepOrder(
                picked.map((line) => __normalizeBulletLikeLine(line)),
                20
            );
        }

        if (!prefBullets.length) {
            const picked = lines
                .filter((l) => /(우대|preferred|nice)/i.test(l))
                .slice(0, 40);
            prefBullets = __dedupeKeepOrder(
                picked.map((line) => __normalizeBulletLikeLine(line)),
                16
            );
        }
    } catch { }

    // bullets + 전체에서 토큰 추출을 같이 쓰되, 최종 요구항목은 토큰(짧고 매칭 쉬움) 중심으로
    const mustTokens = __extractTokensFromText(mustBullets.join("\n"));
    const prefTokens = __extractTokensFromText(prefBullets.join("\n"));

    // "키워드/툴/자격/어학"을 한 리스트로 평탄화
    const flatten = (obj) => __uniq([...(obj.certs || []), ...(obj.tools || []), ...(obj.education || [])]);

    let mustItems = flatten(mustTokens);
    let prefItems = flatten(prefTokens);

    // ✅ 마지막 안전망: 그래도 둘 다 비면 JD 전체에서 한 번 더 토큰
    if (!mustItems.length && mustBullets.length) {
        mustItems = __dedupeKeepOrder(mustBullets, 12);
    }
    if (!prefItems.length && prefBullets.length) {
        prefItems = __dedupeKeepOrder(prefBullets, 8);
    }
    if (!mustItems.length && __structuredReqV2.mustLines.length) {
        mustItems = __dedupeKeepOrder(__structuredReqV2.mustLines, 12);
    }
    if (!mustItems.length && __structuredReqV3.mustLines.length) {
        mustItems = __dedupeKeepOrder(__structuredReqV3.mustLines, 12);
    }
    if (!prefItems.length && __structuredReqV2.prefLines.length) {
        prefItems = __dedupeKeepOrder(__structuredReqV2.prefLines, 8);
    }
    if (!prefItems.length && __structuredReqV3.prefLines.length) {
        prefItems = __dedupeKeepOrder(__structuredReqV3.prefLines, 8);
    }
    if (!mustItems.length && !prefItems.length) {
        const all = __extractTokensFromText(raw);
        mustItems = flatten(all);
    }

    mustItems = mustItems.filter((s) => !__sectionHeaderKeysV3.has(__normalizeJdHeaderV3(s)));
    prefItems = prefItems.filter((s) => !__sectionHeaderKeysV3.has(__normalizeJdHeaderV3(s)));

    return {
        mustTextSample: mustBullets.slice(0, 10),
        prefTextSample: prefBullets.slice(0, 10),
        mustItems,
        prefItems,
    };
}
// ✅ PATCH (append-only): structured extractors (years/language/tools/periods)
// 목적: "많이 뽑기"보다 "틀리지 않게 뽑기" (보수적 추출 + confidence)

function __toInt(x) {
    const n = Number(String(x || "").replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : null;
}

function __monthToIso(y, m) {
    const yy = __toInt(y);
    const mm = __toInt(m);
    if (!yy || !mm || mm < 1 || mm > 12) return null;
    return `${String(yy).padStart(4, "0")}-${String(mm).padStart(2, "0")}`;
}

function __todayIsoYm() {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return __monthToIso(y, m);
}

function __normalizeToolName(raw) {
    const k = __norm(raw);
    if (!k) return null;

    // alias normalize (append-only)
    if (/sap/.test(k)) return "sap";
    if (/oracle/.test(k) && /erp/.test(k)) return "erp";
    if (/\berp\b/.test(k)) return "erp";
    if (/excel|vba|ms excel/.test(k)) return "excel";
    if (/power\s*bi/.test(k)) return "powerbi";
    if (/tableau/.test(k)) return "tableau";
    if (/\bsql\b/.test(k)) return "sql";
    if (/\bpython\b/.test(k)) return "python";
    if (/\br\b/.test(k)) return "r";
    if (/minitab/.test(k)) return "minitab";
    if (/salesforce/.test(k)) return "salesforce";

    return k;
}

function __extractJdYearsRequired(rawText) {
    const raw = String(rawText || "");
    const __structuredYearsV3 = __extractJdYearsRequiredStructuredV3(raw);
    if (__structuredYearsV3) return __structuredYearsV3;
    const __structuredYears = __extractJdYearsRequiredStructured(raw);
    if (__structuredYears) return __structuredYears;
    const lines = raw.split(/\r?\n/).map((l) => String(l || "").trim()).filter(Boolean);
    for (const ln of lines) {
        const koRange = ln.match(/(\d{1,2})\s*년\s*[~\-]\s*(\d{1,2})\s*년/i);
        if (koRange) {
            const min = __toInt(koRange[1]);
            const max = __toInt(koRange[2]);
            if (min && max && min <= max) {
                return { min, max, confidence: 0.9, raw: ln, note: /우대|preferred|nice/i.test(ln) ? "nice" : "must" };
            }
        }
        const koMin = ln.match(/(\d{1,2})\s*년\s*이상/i);
        if (koMin) {
            const min = __toInt(koMin[1]);
            if (min) {
                return { min, max: null, confidence: 0.92, raw: ln, note: /우대|preferred|nice/i.test(ln) ? "nice" : "must" };
            }
        }
        const enMin = ln.match(/(\d{1,2})\+?\s*years?/i);
        if (enMin && /(experience|required|must|qualification|자격|경험)/i.test(ln)) {
            const min = __toInt(enMin[1]);
            if (min) {
                return { min, max: null, confidence: 0.85, raw: ln, note: /우대|preferred|nice/i.test(ln) ? "nice" : "must" };
            }
        }
    }

    // "급" 기반 연차 추정 금지
    const rankRe = /(대리|과장|차장|부장|급)/i;

    // 오탐 방지: tool 사용연차/프로젝트 연차는 yearsRequired가 아님
    const toolExpRe = /(사용|운영)\s*경험/i;
    const projectRe = /(프로젝트|구축|고도화|poc|참여|수행)/i;

    // 연차 인식 조건: (경력|업무|유관|관련|재직|근무) 근처에 n년
    const gateCtxRe = /(경력|업무|유관|관련|재직|근무|role|experience)/i;

    // 2~4년 / 3년 이상 / 1년 이상 / 신입 또는 1년 이상
    const rangeRe = /(\d{1,2})\s*~\s*(\d{1,2})\s*년/;
    const minRe = /(\d{1,2})\s*년\s*(이상|이상\s*경력|경력|보유자|필수)/;

    for (const ln of lines) {
        if (rankRe.test(ln)) continue;

        const hasGateCtx = gateCtxRe.test(ln);
        if (!hasGateCtx) continue;

        // tool 사용연차/프로젝트 연차는 분리: yearsRequired로 넣지 않음
        if (toolExpRe.test(ln) || projectRe.test(ln)) {
            // 예: "SAP 운영 경험 3년 이상"은 yearsRequired가 아니라 toolExperienceYears 성격
            continue;
        }

        let min = null;
        let max = null;
        let confidence = 0.85;

        const mRange = ln.match(rangeRe);
        if (mRange) {
            min = __toInt(mRange[1]);
            max = __toInt(mRange[2]);
            if (min && max && min <= max) {
                // "우대"면 must가 아니라 nice에 가야 함 → 여기서는 yearsRequired만 반환, 분리는 상위에서
                return { min, max, confidence, raw: ln, note: /우대|preferred|nice/i.test(ln) ? "nice" : "must" };
            }
        }

        const mMin = ln.match(minRe);
        if (mMin) {
            min = __toInt(mMin[1]);
            max = null;

            // "이에 준하는" 같이 애매 표현은 confidence 낮춤
            if (/준하는|equivalent/i.test(ln)) confidence = 0.55;

            return { min, max, confidence, raw: ln, note: /우대|preferred|nice/i.test(ln) ? "nice" : "must" };
        }
    }

    return null;
}

function __extractLanguagesFromLine(line, isJd) {
    const ln = String(line || "");
    const out = [];

    // 직접 언급만 인정
    const hasEnglish = /(영어|english)/i.test(ln);
    const hasChinese = /(중국어|chinese|mandarin|hsk)/i.test(ln);
    const hasJapanese = /(일본어|japanese|jlpt)/i.test(ln);

    if (!(hasEnglish || hasChinese || hasJapanese)) return out;
    // ✅ guard: 언어 직접 언급 + 언어 관련 신호가 있을 때만 인정 (오탐 방지)
    const hasLangSignal =
        /(toeic|opic|jlpt|hsk|점수|등급|회화|비즈니스|business|fluent|native|커뮤니케이션|communication|가능|이메일|email|작성|writing|화상회의|미팅|presentation|프레젠테이션)/i.test(ln);
    if (!hasLangSignal) return out;
    // 점수/등급
    // TOEIC 800 / TOEIC 905 (2022.06)
    let m = ln.match(/toeic\s*([0-9]{3})/i) || ln.match(/toeic\s*[:\-]?\s*([0-9]{3})/i);
    if (m) {
        out.push({
            name: "english",
            test: "toeic",
            score: __toInt(m[1]),
            level: null,
            mode: null,
            confidence: 0.95,
            raw: ln,
        });
        return out;
    }

    // OPIC IH/AL/IM2 etc
    m = ln.match(/opic\s*([a-z]{1,3}\d?)/i);
    if (m) {
        out.push({
            name: "english",
            test: "opic",
            score: null,
            level: String(m[1] || "").toUpperCase(),
            mode: null,
            confidence: 0.9,
            raw: ln,
        });
        return out;
    }

    // JLPT N1/N2
    m = ln.match(/jlpt\s*(n[1-5])/i);
    if (m) {
        out.push({
            name: "japanese",
            test: "jlpt",
            score: null,
            level: String(m[1] || "").toUpperCase(),
            mode: null,
            confidence: 0.9,
            raw: ln,
        });
        return out;
    }

    // HSK 5급
    m = ln.match(/hsk\s*([1-6])\s*급?/i);
    if (m) {
        out.push({
            name: "chinese",
            test: "hsk",
            score: __toInt(m[1]),
            level: null,
            mode: null,
            confidence: 0.85,
            raw: ln,
        });
        return out;
    }

    // 정성 레벨
    let level = null;
    let confidence = 0.75;

    if (/native/i.test(ln)) { level = "native"; confidence = 0.85; }
    else if (/fluent/i.test(ln) || /(회화\s*상)/i.test(ln)) { level = "fluent"; confidence = 0.8; }
    else if (/(비즈니스|business)/i.test(ln)) { level = "business"; confidence = 0.8; }
    else if (/(가능|communication|커뮤니케이션)/i.test(ln)) { level = "conversational"; confidence = 0.7; }

    // 이메일/작성은 speaking 승격 금지 → mode로 분리
    let mode = null;
    if (/(이메일|메일|작성|writing)/i.test(ln)) mode = "writing";
    if (/(회화|conversation|speaking)/i.test(ln)) mode = "speaking";
    if (/(프레젠테이션|presentation)/i.test(ln)) mode = mode ? `${mode},presentation` : "presentation";

    const name = hasEnglish ? "english" : hasJapanese ? "japanese" : "chinese";
    if (level || mode) {
        out.push({
            name,
            test: null,
            score: null,
            level,
            mode,
            confidence,
            raw: ln,
        });
    }

    return out;
}

function __extractJdLanguages(rawText) {
    const raw = String(rawText || "");

    // 섹션 기반 우선 분리
    // - 자격요건 섹션에서 잡히는 언어는 기본 must
    // - 우대 섹션은 무조건 nice
    // - 섹션이 아예 없을 때만 전체 스캔 fallback(보수적으로 nice 위주)
    const mustSection = __pickSection(raw, [
        "자격요건",
        "필수",
        "requirements",
        "requirement",
        "must have",
        "must",
        "required",
    ]);

    const prefSection = __pickSection(raw, [
        "우대",
        "preferred",
        "nice to have",
        "good to have",
        "plus",
        "bonus",
    ]);

    const must = [];
    const nice = [];

    const __pushUniq = (arr, items) => {
        for (const it of items || []) {
            // stringify 기반 uniq 유지(현재 함수가 쓰던 방식과 호환)
            arr.push(it);
        }
    };

    const __scanLines = (text, defaultBucket) => {
        const lines = String(text || "")
            .split(/\r?\n/)
            .map((l) => String(l || "").trim())
            .filter(Boolean);

        for (const ln of lines) {
            const items = __extractLanguagesFromLine(ln, true);
            if (!items.length) continue;

            // 라인 자체에 우대/선호 신호가 있으면 nice로 강등(섹션이 must여도)
            let bucket = defaultBucket;
            if (/(우대|선호|preferred|nice to have|good to have|plus|bonus)/i.test(ln)) bucket = "nice";

            // 라인 자체에 must 신호가 있으면 must로 승격(섹션이 nice여도)
            if (/(필수|must|required|requirements)/i.test(ln)) bucket = "must";

            if (bucket === "must") __pushUniq(must, items);
            else __pushUniq(nice, items.map((x) => ({ ...x, confidence: Math.min(x.confidence, 0.6) })));
        }
    };

    // 1) 섹션이 있으면 섹션 규칙이 최우선
    if (mustSection) __scanLines(mustSection, "must");
    if (prefSection) __scanLines(prefSection, "nice");

    // 2) 섹션이 전혀 없을 때만 fallback
    if (!mustSection && !prefSection) {
        __scanLines(raw, "nice");
    }
    // must에 이미 잡힌 언어는 nice에서 제거
    const __mustKeys = new Set(
        must.map((x) => __norm(x && x.name)).filter(Boolean)
    );

    const __niceFiltered = nice.filter((x) => {
        const k = __norm(x && x.name);
        return k && !__mustKeys.has(k);
    });
    return {
        must: __uniq(must.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s)),
        nice: __uniq(__niceFiltered.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s)),
    };
}

function __extractToolsFromLine(line) {
    const ln = String(line || "");
    const out = [];

    // 도구 후보(확장 가능)
    // 도구 후보(정규식 기반: 오탐 방지)
    const toolCandidates = [
        { raw: "SAP", re: /\bSAP\b/i, norm: "sap" },
        { raw: "ERP", re: /\bERP\b/i, norm: "erp" },
        { raw: "Oracle ERP", re: /\bOracle\b.*\bERP\b/i, norm: "erp" },
        { raw: "Excel", re: /\bExcel\b/i, norm: "excel" },
        { raw: "MS Excel", re: /\bMS\s*Excel\b/i, norm: "excel" },
        { raw: "Excel VBA", re: /\bExcel\b.*\bVBA\b/i, norm: "excel" },
        { raw: "Power BI", re: /\bPower\s*BI\b/i, norm: "powerbi" },
        { raw: "Tableau", re: /\bTableau\b/i, norm: "tableau" },
        { raw: "Python", re: /\bPython\b/i, norm: "python" },
        // ✅ 핵심: R은 단독 토큰일 때만(문장 내부 알파벳 r 오탐 방지)
        { raw: "R", re: /\bR\b/i, norm: "r" },
        { raw: "SQL", re: /\bSQL\b/i, norm: "sql" },
        { raw: "Minitab", re: /\bMinitab\b/i, norm: "minitab" },
        { raw: "Salesforce", re: /\bSalesforce\b/i, norm: "salesforce" },
    ];

    const hasAny = toolCandidates.some((t) => t.re.test(ln));
    if (!hasAny) return out;
    // 동사 기반 검증: 사용/운영/구축/개발/자동화/작성/분석 → skill
    const skillVerb = /(사용|운영|구축|개발|자동화|작성|분석|도입|제작|유지보수)/i;

    // exposure: 환경/참여/협업 → skill로 올리지 않음(보수적)
    const exposureVerb = /(환경|참여|협업|함께|지원)/i;

    // implementation vs operation 힌트
    const implVerb = /(도입|구축|고도화|implementation)/i;
    // ✅ 핵심: "관리"는 너무 일반 단어라 제거(매장관리/서류관리 오탐 방지)
    const operVerb = /(운영|유지보수|operation)/i;

    for (const t of toolCandidates) {
        if (!t.re.test(ln)) continue;

        const name = __normalizeToolName(t.norm || t.raw);
        if (!name) continue;

        // 주체 불명/협업만 언급이면 제외
        if (exposureVerb.test(ln) && !skillVerb.test(ln)) continue;

        let evidence = "mentioned";
        let confidence = 0.7;

        if (skillVerb.test(ln)) { evidence = "used"; confidence = 0.85; }
        if (implVerb.test(ln)) { evidence = "implementation"; confidence = Math.min(confidence, 0.8); }
        if (operVerb.test(ln)) { evidence = "operation"; confidence = Math.max(confidence, 0.85); }

        // "학습 중"은 skill 아님
        if (/(학습\s*중|studying|learning)/i.test(ln)) {
            evidence = "learning";
            confidence = 0.45;
        }

        out.push({ name, evidence, confidence, raw: ln });
    }

    // uniq (by name+evidence+raw)
    return __uniq(out.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s));
}

function __extractJdTools(rawText) {
    const raw = String(rawText || "");
    const lines = raw.split(/\r?\n/).map((l) => String(l || "").trim()).filter(Boolean);

    const must = [];
    const nice = [];

    for (const ln of lines) {
        const items = __extractToolsFromLine(ln);
        if (!items.length) continue;

        if (/우대|preferred|nice/i.test(ln)) nice.push(...items);
        else if (/필수|must|required/i.test(ln)) must.push(...items);
        else {
            // JD에서 애매하면 nice로 (보수적)
            nice.push(...items.map((x) => ({ ...x, confidence: Math.min(x.confidence, 0.6) })));
        }
    }

    return {
        must: __uniq(must.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s)),
        nice: __uniq(nice.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s)),
    };
}

function __extractResumeEmploymentPeriods(rawText) {
    const raw = String(rawText || "");
    const lines = raw.split(/\r?\n/).map((l) => String(l || "").trim()).filter(Boolean);

    const periods = [];

    // YYYY.MM ~ YYYY.MM / YYYY.MM ~ 현재 / YYYY년 M월 ~ 현재
    const re1 = /(\d{4})\.(\d{1,2})\s*[~\-]\s*(\d{4})\.(\d{1,2})/;
    const re2 = /(\d{4})\.(\d{1,2})\s*[~\-]\s*(현재|재직중|재직\s*중|present)/i;
    const re3 = /(\d{4})\s*년\s*(\d{1,2})\s*월\s*[~\-]\s*(\d{4})\s*년\s*(\d{1,2})\s*월/i;
    const re4 = /(\d{4})\s*년\s*(\d{1,2})\s*월\s*[~\-]\s*(현재|재직중|재직\s*중|present)/i;

    for (const ln of lines) {
        // 군복무/인턴/프로젝트 기간은 employment로 넣지 않음
        if (/(군\s*복무|병역|인턴|intern|프로젝트|구축|poc|참여|수행)/i.test(ln)) continue;

        let m = ln.match(re1);
        if (m) {
            const from = __monthToIso(m[1], m[2]);
            const to = __monthToIso(m[3], m[4]);
            if (from && to) periods.push({ from, to, isCurrent: false, raw: ln });
            continue;
        }

        m = ln.match(re2);
        if (m) {
            const from = __monthToIso(m[1], m[2]);
            const to = __todayIsoYm();
            if (from && to) periods.push({ from, to, isCurrent: true, raw: ln });
            continue;
        }

        m = ln.match(re3);
        if (m) {
            const from = __monthToIso(m[1], m[2]);
            const to = __monthToIso(m[3], m[4]);
            if (from && to) periods.push({ from, to, isCurrent: false, raw: ln });
            continue;
        }

        m = ln.match(re4);
        if (m) {
            const from = __monthToIso(m[1], m[2]);
            const to = __todayIsoYm();
            if (from && to) periods.push({ from, to, isCurrent: true, raw: ln });
            continue;
        }
    }

    return __uniq(periods.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s));
}

function __extractResumeToolExperienceYears(rawText) {
    const raw = String(rawText || "");
    const lines = raw.split(/\r?\n/).map((l) => String(l || "").trim()).filter(Boolean);

    const out = [];
    // 예: "SAP 운영 경험 3년 이상" / "5년 이상 사용"
    const re = /(.{0,20})(\d{1,2})\s*년\s*(이상)?\s*(사용|운영)\s*(경험)?/i;

    for (const ln of lines) {
        const m = ln.match(re);
        if (!m) continue;

        // 연속/매출 같은 건 제외
        if (/(연속|매출|성장|거래처)/i.test(ln)) continue;

        const years = __toInt(m[2]);
        if (!years) continue;

        const toolPart = m[1] || "";
        const toolName = __normalizeToolName(toolPart);

        if (!toolName) continue;

        out.push({
            name: toolName,
            years,
            confidence: 0.7,
            raw: ln,
        });
    }

    return __uniq(out.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s));
}

function __extractResumeLanguages(rawText) {
    const raw = String(rawText || "");
    const lines = raw.split(/\r?\n/).map((l) => String(l || "").trim()).filter(Boolean);

    const items = [];
    for (const ln of lines) {
        items.push(...__extractLanguagesFromLine(ln, false));
    }
    return __uniq(items.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s));
}

function __extractResumeTools(rawText) {
    const raw = String(rawText || "");
    const lines = raw.split(/\r?\n/).map((l) => String(l || "").trim()).filter(Boolean);

    const items = [];
    for (const ln of lines) {
        items.push(...__extractToolsFromLine(ln));
    }
    return __uniq(items.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s));
}
function __matchItems(requiredItems, haveItems) {
    const req = __uniq(requiredItems);
    const have = __uniq(haveItems);

    const haveNorm = have.map(__norm);
    const hits = [];
    const miss = [];

    for (const r of req) {
        const rn = __norm(r);
        if (!rn) continue;

        // 포함/동치 매칭(보수적으로)
        let ok = false;
        for (const hn of haveNorm) {
            if (!hn) continue;
            if (hn === rn) { ok = true; break; }
            if (hn.includes(rn) || rn.includes(hn)) { ok = true; break; }
        }
        (ok ? hits : miss).push(r);
    }

    return { hits, miss };
}

// ✅ PATCH ROUND 5 (append-only): preferred 오염 항목 mustHave에서 제거
// 필터 기준: 우대/preferred/nice to have/plus/있으면 좋/가산점/bonus 계열 마커
function __isPreferredLine(line) {
    return /(우대|preferred|nice\s*to\s*have|nice-to-have|plus|있으면\s*좋|가산점|bonus)/i.test(String(line || ""));
}

function __filterMustHaveFromPreferred(mustItems, mustTextSample) {
    if (!Array.isArray(mustItems) || !mustItems.length) return mustItems;
    const lines = Array.isArray(mustTextSample) ? mustTextSample : [];
    if (!lines.length) return mustItems;

    const cleanLines = lines.filter((l) => !__isPreferredLine(l));
    const taintedLines = lines.filter((l) => __isPreferredLine(l));
    if (!taintedLines.length) return mustItems; // preferred 오염 없음 → 원본 그대로

    // tainted 라인에 등장하는 토큰 vs clean 라인에 등장하는 토큰
    const inTainted = new Set();
    const inClean = new Set();
    for (const ln of taintedLines) {
        const norm = String(ln).toLowerCase();
        for (const item of mustItems) {
            if (norm.includes(String(item || "").toLowerCase())) inTainted.add(String(item).toLowerCase());
        }
    }
    for (const ln of cleanLines) {
        const norm = String(ln).toLowerCase();
        for (const item of mustItems) {
            if (norm.includes(String(item || "").toLowerCase())) inClean.add(String(item).toLowerCase());
        }
    }

    // tainted 라인에만 있고 clean 라인에 없는 토큰 → 제거
    return mustItems.filter((item) => {
        const key = String(item || "").toLowerCase();
        if (!inTainted.has(key)) return true; // tainted와 무관 → 유지
        return inClean.has(key);              // clean에도 있으면 유지, tainted에만 있으면 제거
    });
}

// ✅ PATCH (append-only): responsibilities extraction helper
// 목적: 담당업무/주요업무 섹션에서 실제 업무 문장만 추출 (헤더/소개 문장 제외)
function __extractJdResponsibilities(rawText) {
    const raw = String(rawText || "");
    const __structuredRespV2 = __extractJdResponsibilitiesStructuredV2(raw);
    const __structuredRespV3 = __extractJdResponsibilitiesStructuredV3(raw);
    const __structuredReqV3 = __extractStructuredJdRequirementsV3(raw);
    const __mustLeakSetV3 = new Set(__structuredReqV3.mustLines.map((line) => __norm(line)));
    const __respSectionLines = __collectSectionLines(raw, {
        headerPatterns: [
            /^(담당 업무|담당업무|주요 업무|주요업무|주요 역할|업무 내용|업무소개|이런 일을 합니다|roles & responsibilities|responsibilities|duties|what you will do)$/i,
        ],
        stopPatterns: [
            /^(자격 요건|자격요건|지원 자격|지원자격|필수 요건|필수요건|우대 사항|우대사항|requirements|required|preferred|must|qualifications)$/i,
        ],
        maxLines: 20,
    });

    // 담당업무/주요 역할 섹션 탐지
    const respSection = __pickSection(raw, [
        "담당업무",
        "주요업무",
        "담당 업무",
        "주요 업무",
        "주요 역할",
        "업무 내용",
        "업무소개",
        "이런 일을 합니다",
        "roles & responsibilities",
        "responsibilities",
        "duties",
        "what you will do",
    ]);

    if (!respSection.trim() && __respSectionLines.length === 0) return [];

    // bullet/numbered 라인 기반 추출
    const bullets = __dedupeKeepOrder([
        ...__extractBullets(respSection),
        ...__respSectionLines.map((line) => __normalizeBulletLikeLine(line)),
        ...__structuredRespV2,
        ...__structuredRespV3,
    ], 18);

    // 헤더성 단문 목록
    const __RESP_HEADERS = new Set([
        "담당업무", "주요업무", "담당 업무", "주요 업무", "주요 역할",
        "업무 내용", "업무소개", "responsibilities", "duties", "roles",
        "담당업무:", "주요업무:", "담당 업무:", "주요 업무:", "주요 역할:",
    ]);

    // 섹션 소개형 노이즈 패턴
    const __NOISE_RE = /^이런 일을 합니다\.?$|^이런 업무를 합니다\.?$|^다음과 같은 업무를 수행합니다\.?$|^주요 업무는|^담당 업무는|^이 포지션은|^본 포지션은|^우리 팀은/i;

    // 짧은 설명형 마무리 (길이 제한 + 종결어)
    const __SHORT_CLOSING_RE = /합니다\.?$|입니다\.?$|드립니다\.?$|됩니다\.?$/;

    return bullets
        .map((s) => String(s || "").trim())
        .filter((s) => {
            if (!s || s.length < 8) return false;
            const sNorm = s.replace(/:$/, "");
            if (__RESP_HEADERS.has(s) || __RESP_HEADERS.has(sNorm)) return false;
            if (__mustLeakSetV3.has(__norm(s))) return false;
            if (__NOISE_RE.test(s)) return false;
            if (s.length < 30 && __SHORT_CLOSING_RE.test(s)) return false;
            return true;
        })
        .slice(0, 15);
}

// ✅ PATCH (append-only): jdModel v1 seed builder
// 목적: 기존 추출 결과를 정규화+래핑해 SSOT jdModel v1 생성
// 기존 필드/로직 일절 변경 없음
function __buildJdModelV1(jd, jdLang, jdTools, at, jdLen, jdYears) {
    // mustHave: preferred 오염 항목 제거 후 조립 (ROUND 5)
    const mustHaveRaw = Array.isArray(jd.mustItems) ? jd.mustItems.slice() : [];
    const mustHave = __filterMustHaveFromPreferred(mustHaveRaw, jd.mustTextSample);
    const preferred = Array.isArray(jd.prefItems) ? jd.prefItems.slice() : [];

    // tools: must + nice 병합, bucket 필드 추가
    const toolsMust = Array.isArray(jdTools && jdTools.must) ? jdTools.must : [];
    const toolsNice = Array.isArray(jdTools && jdTools.nice) ? jdTools.nice : [];
    const tools = [
        ...toolsMust.map((t) => ({ name: t.name, confidence: t.confidence, bucket: "must", raw: t.raw })),
        ...toolsNice.map((t) => ({ name: t.name, confidence: t.confidence, bucket: "nice", raw: t.raw })),
    ];

    // languages: must + nice 병합, bucket 필드 추가
    const langMust = Array.isArray(jdLang && jdLang.must) ? jdLang.must : [];
    const langNice = Array.isArray(jdLang && jdLang.nice) ? jdLang.nice : [];
    const languages = [
        ...langMust.map((l) => ({ name: l.name, bucket: "must", raw: l.raw })),
        ...langNice.map((l) => ({ name: l.name, bucket: "nice", raw: l.raw })),
    ];

    return {
        mustHave,
        preferred,
        tools,
        languages,
        domainKeywords: __extractJdDomainKeywords([
            ...(Array.isArray(jd.mustTextSample) ? jd.mustTextSample : []),
            ...(Array.isArray(jd.prefTextSample) ? jd.prefTextSample : []),
            ...(Array.isArray(jd.responsibilities) ? jd.responsibilities : []),
            ...(Array.isArray(mustHave) ? mustHave : []),
            ...(Array.isArray(preferred) ? preferred : []),
        ].join("\n")),
        // ✅ PATCH (append-only): experienceYears — fit.jd.structured.yearsRequired를 jdModel SSOT로 승격
        experienceYears: {
            min: (jdYears && typeof jdYears.min === "number") ? jdYears.min : null,
            max: (jdYears && typeof jdYears.max === "number") ? jdYears.max : null,
            confidence: (jdYears && typeof jdYears.confidence === "number") ? jdYears.confidence : null,
        },
        responsibilities: Array.isArray(jd.responsibilities) ? jd.responsibilities.slice() : [],
        sections: {
            requiredLines: Array.isArray(jd.mustTextSample) ? jd.mustTextSample.slice() : [],
            preferredLines: Array.isArray(jd.prefTextSample) ? jd.prefTextSample.slice() : [],
            responsibilityLines: Array.isArray(jd.responsibilities) ? jd.responsibilities.slice(0, 10) : [],
        },
        meta: {
            version: "jd-model-v1",
            at: at || null,
            jdLen: typeof jdLen === "number" ? jdLen : 0,
        },
    };
}

export function buildJdResumeFit({ jdText, resumeText }) {
    const at = Date.now();
    // ✅ PATCH (append-only): capture inputs to debug "empty vs pattern-miss"
    const __jdIn = String(jdText || "");
    const __resumeIn = String(resumeText || "");

    const __inputMeta = {
        jdLen: __jdIn.length,
        resumeLen: __resumeIn.length,
        jdSample: __jdIn.slice(0, 240),
        resumeSample: __resumeIn.slice(0, 240),
    };
    const jd = __extractJdRequirements(jdText || "");
    // ✅ PATCH (append-only): responsibilities 추출 후 jd에 주입
    jd.responsibilities = __extractJdResponsibilities(__jdIn);
    const resume = __extractResumeHints(resumeText || "");
    // ✅ PATCH (append-only): structured extraction (conservative)
    const __jdYears = __extractJdYearsRequired(jdText || "");
    const __jdLang = __extractJdLanguages(jdText || "");
    const __jdTools = __extractJdTools(jdText || "");

    const __resumePeriods = __extractResumeEmploymentPeriods(resumeText || "");
    const __resumeLang = __extractResumeLanguages(resumeText || "");
    const __resumeTools = __extractResumeTools(resumeText || "");
    const __resumeToolYears = __extractResumeToolExperienceYears(resumeText || "");
    const haveFlat = __uniq([...(resume.certs || []), ...(resume.tools || []), ...(resume.education || [])]);

    const mustMatch = __matchItems(jd.mustItems || [], haveFlat);
    const prefMatch = __matchItems(jd.prefItems || [], haveFlat);

    const warnings = [];

    // 필수 누락 경고
    if (Array.isArray(mustMatch.miss) && mustMatch.miss.length) {
        warnings.push(
            `JD 필수 누락: ${mustMatch.miss.slice(0, 6).join(", ")}${mustMatch.miss.length > 6 ? "…" : ""}`
        );
    } else if (Array.isArray(jd.mustItems) && jd.mustItems.length) {
        warnings.push(`JD 필수: 현재 텍스트 기준으로는 큰 누락이 감지되지 않았습니다.`);
    }

    // 우대 누락(너무 공격적이면 부담이라 "참고" 톤)
    if (Array.isArray(prefMatch.miss) && prefMatch.miss.length) {
        warnings.push(
            `JD 우대 참고(미기재 가능성): ${prefMatch.miss.slice(0, 6).join(", ")}${prefMatch.miss.length > 6 ? "…" : ""}`
        );
    }

    // 연봉/나이 힌트(민감하니 "검토" 톤)
    if (resume.salaryHint) warnings.push(`이력서 연봉 힌트 감지: ${resume.salaryHint} (표기 방식/밴드 정합성 검토)`);
    if (resume.ageHint) warnings.push(`이력서 나이/연차 힌트 감지: ${resume.ageHint} (직급/연차/밴드 정합성 검토)`);

    const fit = {
        meta: {
            inputs: __inputMeta,
        },
        at,
        jd: {
            meta: {
                inputs: __inputMeta,
            },
            mustItems: jd.mustItems,
            prefItems: jd.prefItems,
            mustTextSample: jd.mustTextSample,
            prefTextSample: jd.prefTextSample,
            structured: {
                yearsRequired: __jdYears,          // {min,max,confidence,raw,note} | null
                languages: __jdLang,               // {must:[], nice:[]}
                tools: __jdTools,                  // {must:[], nice:[]}
            },
        },
        resume: {
            certs: resume.certs,
            tools: resume.tools,
            education: resume.education,
            projectsSample: resume.projectsSample,
            salaryHint: resume.salaryHint,
            ageHint: resume.ageHint,
            structured: {
                employmentPeriods: __resumePeriods,    // [{from,to,isCurrent,raw}]
                languages: __resumeLang,               // [{name,test,score,level,mode,confidence,raw}]
                tools: __resumeTools,                  // [{name,evidence,confidence,raw}]
                toolExperienceYears: __resumeToolYears // [{name,years,confidence,raw}]
            },
        },
        match: {
            must: mustMatch,
            preferred: prefMatch,
        },
        warnings: __uniq(warnings),
        summary: {
            must_total: Array.isArray(jd.mustItems) ? jd.mustItems.length : 0,
            must_hit: Array.isArray(mustMatch.hits) ? mustMatch.hits.length : 0,
            must_miss: Array.isArray(mustMatch.miss) ? mustMatch.miss.length : 0,
            pref_total: Array.isArray(jd.prefItems) ? jd.prefItems.length : 0,
            pref_hit: Array.isArray(prefMatch.hits) ? prefMatch.hits.length : 0,
            pref_miss: Array.isArray(prefMatch.miss) ? prefMatch.miss.length : 0,
        },
    };

    // ✅ PATCH (append-only): jdModel v1 seed 삽입
    fit.jdModel = __buildJdModelV1(jd, __jdLang, __jdTools, at, __jdIn.length, __jdYears);

    return fit;
}
