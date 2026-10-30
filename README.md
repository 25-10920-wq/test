# 🩺 VitalGuard (바이탈가드)
> **생체징후(Vital Signs) 기반 조기경고점수(NEWS) & 응급분류(KTAS) 보건·간호 시뮬레이터**

![VitalGuard](https://img.shields.io/badge/Project-HighSchool_Grade2-teal?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-HTML5_CSS3_JS_Chart.js-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

고등학교 2학년 보건·간호 및 정보/생명과학 교과 융합 탐구 프로젝트로 개발된 환자 중증도 평가 웹 프로그램입니다.

---

## 📌 주요 기능
1. **6대 활력징후(Vital Signs) 실시간 사정**
   - 호흡수(RR), 산소포화도(SpO2), 보충 산소 투여 여부
   - 혈압(수축기/이완기 SBP/DBP), 심박수(HR), 체온(BT), 의식수준(ACVPU)
2. **영국 NHS 표준 조기경고점수 (NEWS 2) 계산 엔진**
   - 각 지표별 0~3점 가중치 부여 및 총점(0~20점) 실시간 산출
   - 잠재적 심정지 및 패혈증 악화 위험군(저위험/중등도/고위험) 선별
3. **한국형 응급환자 분류도구 (KTAS) 간이 판정**
   - 1단계(소생)부터 5단계(비응급)까지 신속 분류 및 권장 대기시간 안내
4. **간호 중재(Nursing Intervention) 자동 권고**
   - 바이탈 재측정 모니터링 주기 결정 (15분 / 1시간 / 4~6시간 / 12시간)
   - 의료진 보고(SBAR) 요건 및 상황별 필수 간호 프로토콜 제시
5. **Chart.js 기반 레이더 차트 시각화**
   - 환자의 생체징후 편차를 방사형 차트로 직관적 시각화
6. **임상 시나리오 원클릭 프리셋**
   - 정상 성인, 천식 급성 악화, 패혈증 의심, 저혈량성 쇼크 시나리오 제공
7. **환자 사정 기록 저장(LocalStorage) 및 리포트 인쇄 기능**

---

## 🖥️ 실행 방법
별도의 서버나 라이브러리 설치 없이, 웹 브라우저(Chrome, Edge 등)에서 `index.html`을 열면 즉시 실행됩니다.

```bash
# 로컬 실행
index.html 더블 클릭
```

---

## 📂 파일 구조
```
├── index.html                     # 메인 웹 페이지 및 UI 구조
├── style.css                      # 커스텀 스타일 및 인쇄 전용 CSS
├── script.js                      # NEWS 점수 및 KTAS 판정 알고리즘
├── README.md                      # 프로젝트 소개 문서
└── Student_Record_Guide.md        # 생기부 세특 기재 문구 예시 및 탐구보고서 요약서
```

---

## 🎓 교과 세특 연계 포인트
- **보건 / 간호:** 임상 활력징후 모니터링과 NEWS 기반 환자 조기 악화 감지 기전 탐구
- **생명과학:** 체내 항상성 조절(혈압/호흡/맥박) 붕괴와 병태생리학적 쇼크 분석
- **정보:** 다중 조건 분기 및 가중치 매핑 알고리즘 설계, 데이터 시각화
