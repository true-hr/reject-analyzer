[목표]
공유 패널이 안 뜨는 원인을 해결한다.
원인: Framer Motion <motion.div>의 transform 때문에 position:fixed가 뷰포트가 아닌 motion.div 컨테이너에 갇힘.
해결: 공유 패널 JSX를 motion.div(및 transform 조상) 바깥으로 이동한다.

[원칙]
- App.jsx 한 파일만
- 최소 수정 (이동만)
- 리팩토링/구조 재구성 금지
- 기존 로직/상태(sharePanelOpen, sharePanelPos, shareAnchorRef 등) 유지
- 패널 JSX 중복 렌더 금지(원래 위치에서 제거 후 새 위치로 이동)

[해야 할 일]
1) 현재 RESULT 탭 렌더 블록 내부(<motion.div> 내부)에 있는
   {sharePanelOpen && (...패널...)} 블록을 찾는다.
2) 그 블록을 “그대로” 잘라서
   </motion.div>와 </AnimatePresence>가 닫힌 뒤,
   최상위 return JSX에서 </div> 닫히기 직전(클로드가 찾은 앵커: </AnimatePresence> 바로 뒤)로 이동한다.
3) 이동 후에도 패널이 state(activeTab과 무관하게) 열릴 수 있으므로,
   필요하면 activeTab === SECTION.RESULT 조건을 함께 걸어
   RESULT 탭에서만 패널이 열리도록 한다. (예: {sharePanelOpen && activeTab===SECTION.RESULT && (...)} )
4) 적용 후: 버튼 클릭 시 패널이 뷰포트 전체에 정상 표시되어야 한다.

[출력]
- App.jsx 수정된 코드만
- 이동한 정확한 앵커(주변 2~3줄) 표시
- diff(+/-) 대신 최종 붙여넣기 코드