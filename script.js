// VitalGuard - 생체징후 기반 조기경고점수(NEWS) 및 간이 KTAS 시뮬레이터 로직

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 캐싱
    const form = document.getElementById('vitalForm');
    const patientNameInput = document.getElementById('patientName');
    const patientAgeInput = document.getElementById('patientAge');
    const patientGenderSelect = document.getElementById('patientGender');
    const chiefComplaintSelect = document.getElementById('chiefComplaint');

    const respRateInput = document.getElementById('respRate');
    const respRateRange = document.getElementById('respRateRange');
    const spo2Input = document.getElementById('spo2');
    const spo2Range = document.getElementById('spo2Range');
    const sysBPInput = document.getElementById('sysBP');
    const diaBPInput = document.getElementById('diaBP');
    const heartRateInput = document.getElementById('heartRate');
    const tempInput = document.getElementById('temp');
    const consciousnessSelect = document.getElementById('consciousness');

    const resultBanner = document.getElementById('resultBanner');
    const riskBadge = document.getElementById('riskBadge');
    const ktasLevelBadge = document.getElementById('ktasLevelBadge');
    const patientSummaryTitle = document.getElementById('patientSummaryTitle');
    const riskSummaryDesc = document.getElementById('riskSummaryDesc');
    const newsScoreDisplay = document.getElementById('newsScoreDisplay');

    const subScoreRR = document.getElementById('subScoreRR');
    const subScoreSpO2 = document.getElementById('subScoreSpO2');
    const subScoreO2 = document.getElementById('subScoreO2');
    const subScoreBP = document.getElementById('subScoreBP');
    const subScoreHR = document.getElementById('subScoreHR');
    const subScoreTemp = document.getElementById('subScoreTemp');

    const monitoringFreqText = document.getElementById('monitoringFreqText');
    const monitoringFreqDesc = document.getElementById('monitoringFreqDesc');
    const physicianActionText = document.getElementById('physicianActionText');
    const physicianActionDesc = document.getElementById('physicianActionDesc');
    const nursingActionList = document.getElementById('nursingActionList');
    const ktasDetailText = document.getElementById('ktasDetailText');

    const historyTableBody = document.getElementById('historyTableBody');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const saveHistoryBtn = document.getElementById('saveHistoryBtn');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const printBtn = document.getElementById('printBtn');
    const presetButtons = document.querySelectorAll('.preset-btn');

    const introToggle = document.getElementById('introToggle');
    const introContent = document.getElementById('introContent');
    const introToggleText = document.getElementById('introToggleText');
    const introToggleIcon = document.getElementById('introToggleIcon');

    // Chart.js 레이더 차트 인스턴스
    let radarChart = null;

    // 1. 슬라이더 - 숫자 인풋 동기화
    function syncInputs(slider, numberInput) {
        slider.addEventListener('input', () => { numberInput.value = slider.value; evaluateVitals(); });
        numberInput.addEventListener('input', () => { slider.value = numberInput.value; evaluateVitals(); });
    }
    syncInputs(respRateRange, respRateInput);
    syncInputs(spo2Range, spo2Input);

    // 기타 수치 변경 시 실시간 재계산
    [sysBPInput, diaBPInput, heartRateInput, tempInput, consciousnessSelect, chiefComplaintSelect].forEach(el => {
        el.addEventListener('input', evaluateVitals);
    });
    document.querySelectorAll('input[name="suppO2"]').forEach(el => {
        el.addEventListener('change', evaluateVitals);
    });

    // 2. NEWS (National Early Warning Score) 점수 산정 알고리즘
    function calculateNEWS(data) {
        let scores = {
            rr: 0,
            spo2: 0,
            o2: 0,
            bp: 0,
            hr: 0,
            temp: 0,
            consciousness: 0
        };

        // 1) 호흡수 (Respiration Rate)
        if (data.rr <= 8) scores.rr = 3;
        else if (data.rr >= 9 && data.rr <= 11) scores.rr = 1;
        else if (data.rr >= 12 && data.rr <= 20) scores.rr = 0;
        else if (data.rr >= 21 && data.rr <= 24) scores.rr = 2;
        else if (data.rr >= 25) scores.rr = 3;

        // 2) 산소포화도 (SpO2)
        if (data.spo2 <= 91) scores.spo2 = 3;
        else if (data.spo2 >= 92 && data.spo2 <= 93) scores.spo2 = 2;
        else if (data.spo2 >= 94 && data.spo2 <= 95) scores.spo2 = 1;
        else if (data.spo2 >= 96) scores.spo2 = 0;

        // 3) 보충 산소 투여 여부
        scores.o2 = (data.suppO2 === 'yes') ? 2 : 0;

        // 4) 수축기 혈압 (Systolic BP)
        if (data.sbp <= 90) scores.bp = 3;
        else if (data.sbp >= 91 && data.sbp <= 100) scores.bp = 2;
        else if (data.sbp >= 101 && data.sbp <= 110) scores.bp = 1;
        else if (data.sbp >= 111 && data.sbp <= 219) scores.bp = 0;
        else if (data.sbp >= 220) scores.bp = 3;

        // 5) 심박수 (Heart Rate)
        if (data.hr <= 40) scores.hr = 3;
        else if (data.hr >= 41 && data.hr <= 50) scores.hr = 1;
        else if (data.hr >= 51 && data.hr <= 90) scores.hr = 0;
        else if (data.hr >= 91 && data.hr <= 110) scores.hr = 1;
        else if (data.hr >= 111 && data.hr <= 130) scores.hr = 2;
        else if (data.hr >= 131) scores.hr = 3;

        // 6) 의식 수준 (ACVPU)
        scores.consciousness = (data.consciousness === 'A') ? 0 : 3;

        // 7) 체온 (Temperature)
        if (data.temp <= 35.0) scores.temp = 3;
        else if (data.temp >= 35.1 && data.temp <= 36.0) scores.temp = 1;
        else if (data.temp >= 36.1 && data.temp <= 38.0) scores.temp = 0;
        else if (data.temp >= 38.1 && data.temp <= 39.0) scores.temp = 1;
        else if (data.temp >= 39.1) scores.temp = 2;

        const totalScore = scores.rr + scores.spo2 + scores.o2 + scores.bp + scores.hr + scores.consciousness + scores.temp;
        const maxSingle = Math.max(scores.rr, scores.spo2, scores.bp, scores.hr, scores.consciousness, scores.temp);

        return { scores, totalScore, maxSingle };
    }

    // 3. KTAS (한국형 응급환자 분류도구) 간이 판정 알고리즘
    function calculateKTAS(newsResult, data) {
        // Level 1: 소생 (Resuscitation) - 심정지, 무의식(U), 극단적 호흡저하/저혈압
        if (data.consciousness === 'U' || data.sbp < 70 || data.rr <= 6 || data.spo2 < 82) {
            return {
                level: 1,
                name: 'KTAS 1단계: 소생 (Resuscitation)',
                waitTime: '즉시 진료 (대기시간 0분)',
                color: 'from-rose-800 to-red-950',
                badgeColor: 'bg-rose-950 text-rose-200 border-rose-500',
                desc: '생명이나 사지가 즉각적으로 위협받는 심각한 상태로 즉각적인 처치가 요구됩니다.'
            };
        }
        // Level 2: 긴급 (Emergent) - NEWS 7점 이상, 호흡곤란 + SpO2 < 90, 심한 흉통
        if (newsResult.totalScore >= 7 || (data.chiefComplaint === 'chest_pain' && data.sbp < 95) || data.consciousness === 'P' || data.consciousness === 'V') {
            return {
                level: 2,
                name: 'KTAS 2단계: 긴급 (Emergent)',
                waitTime: '15분 이내 진료',
                color: 'from-rose-600 to-rose-800',
                badgeColor: 'bg-rose-900 text-rose-100 border-rose-400',
                desc: '생명 또는 사지, 신체기능의 잠재적 위험 상태로 신속한 의학적 개입이 필요합니다.'
            };
        }
        // Level 3: 응급 (Urgent) - NEWS 5~6점, 또는 단일 지표 3점, 급성 복통/호흡곤란
        if (newsResult.totalScore >= 5 || newsResult.maxSingle >= 3 || data.chiefComplaint === 'dyspnea' || data.chiefComplaint === 'abdominal_pain') {
            return {
                level: 3,
                name: 'KTAS 3단계: 응급 (Urgent)',
                waitTime: '30분 이내 진료',
                color: 'from-amber-600 to-orange-700',
                badgeColor: 'bg-amber-900 text-amber-200 border-amber-400',
                desc: '진행성 위험이 있거나 중등도의 고통을 동반한 상태로 안정화 치료가 필요합니다.'
            };
        }
        // Level 4: 준응급 (Less Urgent) - NEWS 1~4점
        if (newsResult.totalScore >= 1) {
            return {
                level: 4,
                name: 'KTAS 4단계: 준응급 (Less Urgent)',
                waitTime: '60분 이내 진료',
                color: 'from-sky-600 to-teal-700',
                badgeColor: 'bg-sky-900 text-sky-200 border-sky-400',
                desc: '연령, 고통 정도 및 합병증을 고려해 1~2시간 내 치료를 요하는 상태입니다.'
            };
        }
        // Level 5: 비응급 (Non-urgent) - NEWS 0점, 경증 검진
        return {
            level: 5,
            name: 'KTAS 5단계: 비응급 (Non-urgent)',
            waitTime: '120분 이내 진료',
            color: 'from-emerald-600 to-teal-700',
            badgeColor: 'bg-emerald-900 text-emerald-200 border-emerald-400',
            desc: '급성 악화 가능성이 거의 없는 만성 또는 경미한 상태로 필요 시 외래 연계가 가능합니다.'
        };
    }

    // 4. 간호 중재 프로토콜 추천 생성기
    function getNursingInterventions(newsResult, ktas, data) {
        let freq = { text: '', desc: '' };
        let notify = { text: '', desc: '' };
        let actions = [];

        if (newsResult.totalScore >= 7 || ktas.level <= 2) {
            // 고위험군 (High Risk)
            freq.text = '지속적 연속 모니터링 (Continuous EKG/SpO2)';
            freq.desc = '최소 15~30분 간격 혈압 및 생체징후 반복 측정';
            notify.text = '신속대응팀(RRS/MET) 또는 당직의 즉각 호출 (STAT Call)';
            notify.desc = '중환자실(ICU) 전실 또는 집중소생 처치 필요 여부 평가';

            actions.push('기도 확보 및 고유량 산소 공급 준비 (비재호흡 마스크 또는 High-flow O2)');
            actions.push('굵은 정맥로(18G 또는 20G IV line) 최소 2개 확보 및 수액 요법 준비');
            actions.push('12-Lead 심전도(ECG) 및 응급 동맥혈가스분석(ABGA), 전해질 검사 즉시 채혈');
            actions.push('유치도뇨관(Foley catheter) 삽입 고려 및 시간당 소변량(Urine Output) 엄밀 측정');
            if (data.temp >= 38.5) actions.push('해열제 투여 검토 및 혈액 배양(Blood Culture) 2쌍 채취 전 항생제 투여 금지 주의');
        } else if (newsResult.totalScore >= 5 || newsResult.maxSingle >= 3 || ktas.level === 3) {
            // 중등도 위험군 (Medium Risk)
            freq.text = '최소 1시간마다 바이탈 재측정';
            freq.desc = '상태 변화 시 측정 주기를 30분으로 즉시 단축';
            notify.text = '병동 주치의 또는 책임간호사에게 긴급 보고';
            notify.desc = '환자 상태 및 바이탈 변화 추이를 SBAR 양식으로 구조화하여 인계';

            actions.push('비강 캐뉼라(Nasal prong) 등을 통한 산소 공급 및 SpO2 94~98% 유지');
            actions.push('정맥 정주로(IV access) 개방성 점검 및 처방된 기본 수액 투여');
            actions.push('처방 약물(기관지확장제, 진통제 등) 투여 후 30분 이내 효과 및 부작용 재사정');
            actions.push('침상 안정 유지 및 낙상 고위험군 표식 부착, 콜벨(Call bell) 손 닿는 위치 배치');
        } else if (newsResult.totalScore >= 1) {
            // 저위험군 경미한 변화
            freq.text = '최소 4~6시간마다 바이탈 재측정';
            freq.desc = '환자 호소 증상 악화 시 즉시 비정규 바이탈 추가 측정';
            notify.text = '정규 회진 시 담당의 보고';
            notify.desc = '경미한 이상 징후 추이를 전자의무기록(EMR) 간호기록지에 상세 기록';

            actions.push('환자에게 불편감 발생 시 즉시 간호사를 호출하도록 교육');
            actions.push('적절한 수분 섭취 장려 및 체위 변경(Fowler 체위 등 편안한 자세 유지)');
            actions.push('활력징후 정상 범위 회복 여부 관찰');
        } else {
            // 정상
            freq.text = '최소 12시간마다 1회 (정규 루틴)';
            freq.desc = '병동 기본 프로토콜에 따른 1일 2~3회 측정';
            notify.text = '통상적 의사 회진 보고';
            notify.desc = '특이 소견 없음';

            actions.push('기본 건강 사정 및 과거력, 알레르기 유무 확인');
            actions.push('일상 생활 활동(ADL) 수행 능력 확인 및 환경 안전 점검');
            actions.push('퇴원 또는 입원 관련 일반 주의사항 안내');
        }

        return { freq, notify, actions };
    }

    // 5. 점수 뱃지 UI 컬러 헬퍼
    function updateBadge(badgeElement, score) {
        badgeElement.textContent = score + '점';
        badgeElement.className = 'font-bold px-2 py-0.5 rounded text-white text-xs ';
        if (score === 0) badgeElement.classList.add('bg-emerald-500');
        else if (score === 1) badgeElement.classList.add('bg-sky-500');
        else if (score === 2) badgeElement.classList.add('bg-amber-500');
        else badgeElement.classList.add('bg-rose-600');
    }

    // 6. 종합 바이탈 평가 실행 함수
    function evaluateVitals() {
        const data = {
            name: patientNameInput.value.trim() || '환자_01',
            age: parseInt(patientAgeInput.value) || 30,
            gender: patientGenderSelect.value,
            chiefComplaint: chiefComplaintSelect.value,
            rr: parseInt(respRateInput.value) || 16,
            spo2: parseInt(spo2Input.value) || 98,
            suppO2: document.querySelector('input[name="suppO2"]:checked').value,
            sbp: parseInt(sysBPInput.value) || 120,
            dbp: parseInt(diaBPInput.value) || 80,
            hr: parseInt(heartRateInput.value) || 75,
            temp: parseFloat(tempInput.value) || 36.5,
            consciousness: consciousnessSelect.value
        };

        const news = calculateNEWS(data);
        const ktas = calculateKTAS(news, data);
        const intervention = getNursingInterventions(news, ktas, data);

        // UI 갱신: NEWS 점수별 뱃지
        updateBadge(subScoreRR, news.scores.rr);
        updateBadge(subScoreSpO2, news.scores.spo2);
        updateBadge(subScoreO2, news.scores.o2);
        updateBadge(subScoreBP, news.scores.bp);
        updateBadge(subScoreHR, news.scores.hr);
        updateBadge(subScoreTemp, news.scores.temp);

        // 총점 표시
        newsScoreDisplay.textContent = news.totalScore;
        patientSummaryTitle.textContent = `${data.name} (${data.age}세/${data.gender}) - ${news.totalScore >= 7 ? '위중/고위험군' : (news.totalScore >= 5 ? '주의/중등도' : (news.totalScore >= 1 ? '경미한 이상' : '안정 상태'))}`;
        
        // 배너 배경색 & 뱃지 갱신
        resultBanner.className = `rounded-2xl p-6 text-white shadow-lg bg-gradient-to-r transition-all duration-300 ${ktas.color}`;
        riskBadge.className = `text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide ${ktas.badgeColor}`;
        
        if (news.totalScore >= 7) {
            riskBadge.textContent = '고위험군 (High Risk)';
            riskSummaryDesc.textContent = '임상적 악화 및 심정지 발생 위험이 매우 높습니다. 집중 소생 및 즉각적인 의료진 개입이 필수적입니다.';
        } else if (news.totalScore >= 5 || news.maxSingle >= 3) {
            riskBadge.textContent = '중등도 위험군 (Medium Risk)';
            riskSummaryDesc.textContent = '생체징후가 유의미하게 저하되어 급격한 악화 가능성이 있습니다. 바이탈 주기 단축 및 의사 보고가 요구됩니다.';
        } else if (news.totalScore >= 1) {
            riskBadge.textContent = '저위험군 (Low Risk - 변화 관찰)';
            riskSummaryDesc.textContent = '경미한 생체징후 편차가 있습니다. 잠재적 원인 파악 및 주기적인 추적 관찰을 수행합니다.';
        } else {
            riskBadge.textContent = '정상군 (Normal - 최저 위험)';
            riskSummaryDesc.textContent = '모든 생체징후가 정상 범주 내에 있습니다. 일상적인 병동 관찰 수칙을 유지합니다.';
        }

        ktasLevelBadge.textContent = ktas.name.split(':')[0];
        ktasDetailText.textContent = `${ktas.name}로 판정되었습니다. 권장 허용 진료 대기시간은 [${ktas.waitTime}]입니다. ${ktas.desc}`;

        // 간호 중재 사항 반영
        monitoringFreqText.textContent = intervention.freq.text;
        monitoringFreqDesc.textContent = intervention.freq.desc;
        physicianActionText.textContent = intervention.notify.text;
        physicianActionDesc.textContent = intervention.notify.desc;

        nursingActionList.innerHTML = intervention.actions.map(act => `<li>${act}</li>`).join('');

        // 레이더 차트 갱신
        updateRadarChart(news.scores);

        return { data, news, ktas, intervention };
    }

    // 7. Chart.js 레이더 차트 렌더링
    function updateRadarChart(scores) {
        const ctx = document.getElementById('vitalRadarChart').getContext('2d');
        const labels = ['호흡수', '산소포화도', '혈압(수축기)', '심박수', '의식수준', '체온'];
        const values = [scores.rr, scores.spo2, scores.bp, scores.hr, scores.consciousness, scores.temp];

        if (radarChart) {
            radarChart.data.datasets[0].data = values;
            radarChart.update();
        } else {
            radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'NEWS 이상 위험도 점수 (0:정상 ~ 3:중증)',
                        data: values,
                        backgroundColor: 'rgba(13, 148, 136, 0.25)',
                        borderColor: '#0d9488',
                        pointBackgroundColor: '#0f766e',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#0f766e',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            min: 0,
                            max: 3,
                            ticks: {
                                stepSize: 1,
                                display: false
                            },
                            pointLabels: {
                                font: {
                                    size: 11,
                                    family: 'Pretendard'
                                },
                                color: '#475569'
                            },
                            grid: {
                                color: '#e2e8f0'
                            },
                            angleLines: {
                                color: '#cbd5e1'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    // 8. 프리셋 시나리오 로딩
    const scenarios = {
        normal: {
            name: '김정상', age: 45, gender: '남성', complaint: 'checkup',
            rr: 16, spo2: 98, suppO2: 'no', sbp: 120, dbp: 80, hr: 72, temp: 36.6, cons: 'A'
        },
        asthma: {
            name: '이천식', age: 24, gender: '여성', complaint: 'dyspnea',
            rr: 28, spo2: 89, suppO2: 'yes', sbp: 135, dbp: 88, hr: 116, temp: 37.1, cons: 'A'
        },
        sepsis: {
            name: '박패혈', age: 68, gender: '남성', complaint: 'fever',
            rr: 26, spo2: 93, suppO2: 'no', sbp: 86, dbp: 54, hr: 128, temp: 39.4, cons: 'C'
        },
        shock: {
            name: '최쇼크', age: 35, gender: '남성', complaint: 'bleeding',
            rr: 32, spo2: 88, suppO2: 'yes', sbp: 72, dbp: 40, hr: 142, temp: 35.2, cons: 'V'
        }
    };

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sc = scenarios[btn.dataset.case];
            if (!sc) return;
            patientNameInput.value = sc.name;
            patientAgeInput.value = sc.age;
            patientGenderSelect.value = sc.gender;
            chiefComplaintSelect.value = sc.complaint;

            respRateInput.value = sc.rr;
            respRateRange.value = sc.rr;
            spo2Input.value = sc.spo2;
            spo2Range.value = sc.spo2;

            document.querySelector(`input[name="suppO2"][value="${sc.suppO2}"]`).checked = true;
            sysBPInput.value = sc.sbp;
            diaBPInput.value = sc.dbp;
            heartRateInput.value = sc.hr;
            tempInput.value = sc.temp;
            consciousnessSelect.value = sc.cons;

            evaluateVitals();
        });
    });

    // 9. 로컬스토리지 저장 및 이력 관리
    const STORAGE_KEY = 'vitalguard_patient_history';

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveHistoryItem(record) {
        const history = getHistory();
        history.unshift(record);
        if (history.length > 30) history.pop(); // 최대 30개 유지
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = getHistory();
        if (history.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-6 text-slate-400">저장된 환자 사정 기록이 없습니다.</td>
                </tr>
            `;
            return;
        }

        historyTableBody.innerHTML = history.map((item, index) => {
            const dateStr = new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let badgeClass = item.newsScore >= 7 ? 'bg-rose-100 text-rose-700' : (item.newsScore >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700');
            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-3 py-2 text-slate-500 font-mono">${dateStr}</td>
                    <td class="px-3 py-2 font-bold text-slate-800">${item.name} (${item.age}세)</td>
                    <td class="px-3 py-2 text-slate-600">${item.complaintText}</td>
                    <td class="px-3 py-2 font-mono text-[11px]">
                        BP:${item.sbp}/${item.dbp} | HR:${item.hr} | RR:${item.rr} | SpO2:${item.spo2}%
                    </td>
                    <td class="px-3 py-2">
                        <span class="px-2 py-0.5 rounded-full font-bold ${badgeClass}">NEWS ${item.newsScore}점</span>
                    </td>
                    <td class="px-3 py-2 font-medium text-slate-700">${item.ktasName.split(':')[0]}</td>
                    <td class="px-3 py-2 text-center">
                        <button type="button" class="delete-history-btn text-slate-400 hover:text-rose-500 p-1" data-index="${index}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // 삭제 버튼 이벤트
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index);
                const history = getHistory();
                history.splice(idx, 1);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                renderHistory();
            });
        });
    }

    // 저장 버튼 클릭
    saveHistoryBtn.addEventListener('click', () => {
        const evalResult = evaluateVitals();
        const selectedComplaintText = chiefComplaintSelect.options[chiefComplaintSelect.selectedIndex].text.split('(')[0].trim();
        const record = {
            timestamp: new Date().toISOString(),
            name: evalResult.data.name,
            age: evalResult.data.age,
            gender: evalResult.data.gender,
            complaintText: selectedComplaintText,
            sbp: evalResult.data.sbp,
            dbp: evalResult.data.dbp,
            hr: evalResult.data.hr,
            rr: evalResult.data.rr,
            spo2: evalResult.data.spo2,
            temp: evalResult.data.temp,
            newsScore: evalResult.news.totalScore,
            ktasName: evalResult.ktas.name
        };

        saveHistoryItem(record);
        alert(`[${record.name}] 환자의 사정 기록이 저장되었습니다.`);
    });

    // 전체 삭제
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('저장된 모든 환자 사정 기록을 삭제하시겠습니까?')) {
            localStorage.removeItem(STORAGE_KEY);
            renderHistory();
        }
    });

    // 인쇄 버튼
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // 폼 제출 이벤트
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        evaluateVitals();
    });

    // 폼 초기화 버튼
    resetFormBtn.addEventListener('click', () => {
        form.reset();
        evaluateVitals();
    });

    // 상단 가이드 토글
    introToggle.addEventListener('click', () => {
        introContent.classList.toggle('hidden');
        const isHidden = introContent.classList.contains('hidden');
        introToggleText.textContent = isHidden ? '설명 펼치기' : '설명 접기';
        introToggleIcon.className = isHidden ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
    });

    // 초기 실행
    evaluateVitals();
    renderHistory();
});

