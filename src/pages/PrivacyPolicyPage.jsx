import React from "react";

const UPDATED_AT = "2026년 5월 31일";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <a
          href={import.meta.env.BASE_URL || "/"}
          className="text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          PASSMAP으로 돌아가기
        </a>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-violet-700">PASSMAP Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            개인정보처리방침
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">시행일: {UPDATED_AT}</p>

          <div className="mt-8 space-y-8 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-950">1. 적용 대상</h2>
              <p className="mt-3">
                본 개인정보처리방침은 PASSMAP 서비스와 Chrome 확장 프로그램
                <span className="font-semibold"> PASSMAP AI 작업 저장</span>에 적용됩니다.
                PASSMAP은 사용자가 직접 저장을 요청한 업무 관련 내용을 커리어 기록과 이력서 재료로
                정리할 수 있도록 지원합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">2. 수집하는 정보</h2>
              <p className="mt-3">PASSMAP은 서비스 제공을 위해 다음 정보를 처리할 수 있습니다.</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>사용자가 직접 저장을 요청한 선택 텍스트 또는 AI 대화 내용</li>
                <li>현재 페이지 제목</li>
                <li>현재 페이지 URL</li>
                <li>저장 시각</li>
                <li>PASSMAP 계정 식별에 필요한 최소 정보가 있는 경우 해당 정보</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">3. 수집 목적</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>PASSMAP 업무기록 후보 생성</li>
                <li>사용자의 커리어 기록, 업무기록, 이력서 재료 정리 지원</li>
                <li>사용자가 저장한 후보 내용을 PASSMAP 화면에서 확인하고 수정할 수 있도록 지원</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">4. 수집 방식</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  정보는 사용자가 확장 버튼 또는 우클릭 메뉴를 직접 실행한 경우에만 전송됩니다.
                </li>
                <li>PASSMAP은 백그라운드에서 모든 웹페이지를 지속 감시하지 않습니다.</li>
                <li>PASSMAP은 사용자의 전체 브라우징 기록을 수집하지 않습니다.</li>
                <li>
                  확장 프로그램은 사용자가 저장을 요청한 범위의 텍스트와 해당 페이지의 기본 맥락
                  정보만 PASSMAP으로 보냅니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">5. 제3자 제공</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>PASSMAP은 사용자 데이터를 판매하지 않습니다.</li>
                <li>전용 목적과 관련 없는 목적으로 사용자 데이터를 제3자에게 전송하지 않습니다.</li>
                <li>법령상 필요한 경우를 제외하고 사용자 데이터를 외부에 제공하지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">6. 보관 및 삭제</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>사용자는 PASSMAP 내에서 저장된 기록을 확인, 수정, 삭제할 수 있습니다.</li>
                <li>삭제 요청이 접수되면 PASSMAP은 합리적인 기간 내에 처리합니다.</li>
                <li>서비스 운영상 필요한 기록은 관련 법령과 운영 목적에 필요한 기간 동안 보관될 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">7. 민감정보</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>PASSMAP은 비밀번호, 결제정보, 인증정보를 의도적으로 수집하지 않습니다.</li>
                <li>
                  사용자가 AI 대화 또는 선택 텍스트에 민감정보를 포함한 경우, 저장 전 내용을 확인하고
                  불필요한 정보를 삭제한 뒤 전송해야 합니다.
                </li>
                <li>저장된 기록에 민감정보가 포함된 경우 사용자는 PASSMAP 내에서 해당 기록을 삭제할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">8. 문의</h2>
              <p className="mt-3">
                개인정보 처리와 관련한 문의는 아래 연락처로 보내주시기 바랍니다.
              </p>
              <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 font-semibold text-slate-800">
                qorrkdtks12@naver.com
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
