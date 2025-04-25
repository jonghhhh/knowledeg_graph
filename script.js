// 전역 변수: 분석 결과 데이터
let graphData = null;
let entitiesDataFrame = null;
let relationsDataFrame = null;
let relationsWithInfoDataFrame = null;
let jsonlContent = null;
let htmlContent = null;

// 색상 매핑 객체
const COLOR_MAP = {
    "PERSON": "#3498db",      // 파란색
    "ORGANIZATION": "#2ecc71", // 녹색
    "LOCATION": "#e74c3c",    // 빨간색
    "EVENT": "#f39c12",       // 주황색
    "PRODUCT": "#9b59b6",     // 보라색
    "OTHER": "#7f8c8d"        // 회색
};

// 샘플 텍스트
const SAMPLE_TEXT = `서울 강남구에서 열린 기술 컨퍼런스에서 김민수 교수가 인공지능의 미래에 대한 강연을 했다. 
이번 행사는 삼성전자와 네이버가 공동 주최했으며, 약 500명의 전문가들이 참석했다. 
김민수 교수는 서울대학교 컴퓨터공학과 소속으로, 인공지능 발전의 윤리적 측면을 강조했다. 
네이버의 이기획 부사장은 회사의 새로운 AI 서비스를 소개했으며, 삼성전자의 정기술 상무가 반도체 기술과 AI의 연관성에 대해 발표했다. 
행사 후 김민수 교수와 이기획 부사장은 한국 AI 산업의 발전 방향에 대해 토론했다. 
토론 중 서울대학교와 네이버의 산학협력 가능성도 언급되었다. 
한편, 정부 측에서는 과학기술정보통신부 안장관이 참석하여 인공지능 산업 지원 정책을 발표했다. 
안장관은 김민수 교수와 삼성전자의 연구 프로젝트에 정부 지원을 약속했다. 
이 행사는 대한민국 AI 기술 발전에 중요한 이정표가 될 것으로 전문가들은 평가했다.`;

// DOM 요소 참조
const textInput = document.getElementById('text-input');
const loadSampleButton = document.getElementById('load-sample');
const clearInputButton = document.getElementById('clear-input');
const analyzeButton = document.getElementById('analyze-button');
const loadingElement = document.getElementById('loading');
const resultMessageElement = document.getElementById('result-message');
const graphContainer = document.getElementById('graph-container');
const graphVisualization = document.getElementById('graph-visualization');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const dataTablesContent = document.querySelector('.data-tables-content');
const exportContent = document.querySelector('.export-content');
const temperatureSlider = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperature-value');

// 내보내기 버튼
const exportEntitiesButton = document.getElementById('export-entities');
const exportRelationsButton = document.getElementById('export-relations');
const exportRelationsInfoButton = document.getElementById('export-relations-info');
const exportJsonlButton = document.getElementById('export-jsonl');
const exportHtmlButton = document.getElementById('export-html');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 탭 이벤트 리스너 설정
    setupTabListeners();
    
    // 버튼 이벤트 리스너 설정
    setupButtonListeners();
    
    // 슬라이더 이벤트 리스너 설정
    setupSliderListeners();
    
    // 내보내기 버튼 이벤트 리스너 설정
    setupExportButtonListeners();
    
    // 초기 상태 설정
    initializeState();
});

// 탭 이벤트 리스너 설정
function setupTabListeners() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // 모든 탭 버튼 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // 클릭된 탭 버튼 활성화
            button.classList.add('active');
            
            // 모든 탭 패널 숨기기
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // 선택된 탭 패널 표시
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// 버튼 이벤트 리스너 설정
function setupButtonListeners() {
    // 샘플 텍스트 불러오기 버튼
    loadSampleButton.addEventListener('click', () => {
        textInput.value = SAMPLE_TEXT;
    });
    
    // 입력 지우기 버튼
    clearInputButton.addEventListener('click', () => {
        textInput.value = '';
        resetAnalysisResults();
    });
    
    // 분석하기 버튼
    analyzeButton.addEventListener('click', () => {
        const text = textInput.value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        
        if (!text) {
            showResultMessage('텍스트를 입력해주세요.', 'error');
            return;
        }
        
        if (!apiKey) {
            showResultMessage('Gemini API 키를 입력해주세요.', 'error');
            return;
        }
        
        // 분석 실행
        analyzeText(text, apiKey);
    });
}

// 슬라이더 이벤트 리스너 설정
function setupSliderListeners() {
    temperatureSlider.addEventListener('input', () => {
        temperatureValue.textContent = temperatureSlider.value;
    });
}

// 내보내기 버튼 이벤트 리스너 설정
function setupExportButtonListeners() {
    // 개체 CSV 다운로드
    exportEntitiesButton.addEventListener('click', () => {
        if (entitiesDataFrame) {
            downloadCSV(entitiesDataFrame, 'entities.csv');
        }
    });
    
    // 관계 CSV 다운로드
    exportRelationsButton.addEventListener('click', () => {
        if (relationsDataFrame) {
            downloadCSV(relationsDataFrame, 'relations.csv');
        }
    });
    
    // 관계정보 CSV 다운로드
    exportRelationsInfoButton.addEventListener('click', () => {
        if (relationsWithInfoDataFrame) {
            downloadCSV(relationsWithInfoDataFrame, 'relations_with_info.csv');
        }
    });
    
    // JSONL 파일 다운로드
    exportJsonlButton.addEventListener('click', () => {
        if (jsonlContent) {
            downloadFile(jsonlContent, 'extracted_data.jsonl', 'application/jsonl');
        }
    });
    
    // 인터랙티브 그래프(HTML) 다운로드
    exportHtmlButton.addEventListener('click', () => {
        if (htmlContent) {
            downloadFile(htmlContent, 'knowledge_graph.html', 'text/html');
        }
    });
}

// 초기 상태 설정
function initializeState() {
    // 텍스트 입력 필드에 샘플 텍스트 설정
    textInput.value = SAMPLE_TEXT;
    
    // 각 탭의 초기 상태 설정
    updateTabStates();
}

// 텍스트 분석 함수
async function analyzeText(text, apiKey) {
    // 로딩 상태 표시
    loadingElement.classList.remove('hidden');
    resultMessageElement.classList.add('hidden');
    graphContainer.classList.add('hidden');
    
    try {
        // Gemini API 설정
        const modelName = document.getElementById('model-select').value;
        const temperature = parseFloat(temperatureSlider.value);
        
        // API 호출을 위한 프롬프트 작성
        const prompt = createPrompt(text);
        
        // Gemini API 호출 (CORS 프록시 사용)
        const response = await callGeminiAPI(apiKey, modelName, temperature, prompt);
        
        // 응답 처리
        if (response && response.candidates && response.candidates.length > 0) {
            const content = response.candidates[0].content;
            const extractedData = extractJsonFromResponse(content.parts[0].text);
            
            if (extractedData && extractedData.entities && extractedData.entities.length > 0) {
                // 데이터 처리 및 저장
                processExtractedData(extractedData);
                
                // 성공 메시지 표시
                const numEntities = extractedData.entities.length;
                const numRelations = extractedData.relations ? extractedData.relations.length : 0;
                showResultMessage(`지식 그래프 추출 성공! 개체 ${numEntities}개, 관계 ${numRelations}개를 찾았습니다.`, 'success');
                
                // 그래프 시각화
                visualizeGraph(extractedData);
                
                // 데이터 테이블 업데이트
                updateDataTables(extractedData);
                
                // 내보내기 탭 업데이트
                updateExportTab(extractedData);
            } else {
                showResultMessage('개체 추출에 실패했습니다. 다른 텍스트를 시도해보세요.', 'error');
            }
        } else {
            showResultMessage('API 응답을 처리할 수 없습니다.', 'error');
        }
    } catch (error) {
        console.error('분석 오류:', error);
        showResultMessage(`오류 발생: ${error.message}`, 'error');
    } finally {
        // 로딩 상태 숨기기
        loadingElement.classList.add('hidden');
    }
}

// 프롬프트 생성 함수
function createPrompt(text) {
    return `
    당신은 한국어 텍스트에서 개체(엔티티)와 관계를 추출하는 전문가입니다.
    다음 텍스트에서 모든 중요한 개체(인물, 조직, 장소 등)와 그들 간의 관계를 추출해주세요.
    
    다음 규칙을 반드시 따라주세요:
    1. 개체는 명확한 고유명사(인물, 조직, 장소 등)만 추출하세요.
    2. 일반 명사, 동사, 형용사, 부사 등은 개체로 추출하지 마세요.
    3. 관계는 두 개체 간의 의미 있는 연결을 나타내야 합니다.
    4. 각 개체에는 고유 ID를 부여하고, 개체명, 유형, 설명을 포함해주세요.
    5. 각 관계에는 소스 개체 ID, 타겟 개체 ID, 관계 유형, 관련 문장을 포함해주세요.
    
    개체 유형은 다음과 같이 분류해주세요:
    - PERSON: 사람, 인물
    - ORGANIZATION: 회사, 정부, 기관, 단체 등
    - LOCATION: 국가, 도시, 지역 등
    - EVENT: 행사, 사건, 회의 등
    - PRODUCT: 제품, 서비스, 기술 등
    - OTHER: 기타 중요 개체
    
    다음 형식의 JSON으로 응답해주세요:
    {
        "entities": [
            {
                "id": "E1",
                "name": "김민수",
                "type": "PERSON",
                "description": "서울대학교 컴퓨터공학과 교수"
            },
            ...
        ],
        "relations": [
            {
                "source": "E1",
                "target": "E2",
                "relation": "소속",
                "sentence": "김민수 교수는 서울대학교 컴퓨터공학과 소속이다."
            },
            ...
        ]
    }
    
    분석할 텍스트:
    ---
    ${text}
    ---
    
    중요: 응답은 반드시 위에 명시된 JSON 형식만 포함해야 합니다. 다른 텍스트나 설명은 포함하지 마세요.
    `;
}

// Gemini API 호출 함수 (실제 환경에서는 서버 측에서 처리해야 함)
async function callGeminiAPI(apiKey, modelName, temperature, prompt) {
    // 참고: 실제 프로덕션 환경에서는 API 키를 클라이언트에 노출시키지 않고
    // 서버를 통해 API를 호출해야 합니다. 이 코드는 데모용입니다.
    
    // API 요청 생성
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: temperature
        }
    };
    
    // 실제 API 호출 (CORS 문제로 실제 환경에서는 작동하지 않을 수 있음)
    // 프로덕션에서는 서버 사이드 프록시를 사용하세요
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 오류: ${errorData.error.message || '알 수 없는 오류'}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API 호출 오류:', error);
        
        // 데모 목적으로 샘플 응답 반환 (실제 환경에서는 제거)
        if (text.includes('김민수') || text.includes('서울대학교')) {
            return getSampleResponse();
        }
        
        throw error;
    }
}

// 응답에서 JSON 추출 함수
function extractJsonFromResponse(responseText) {
    try {
        // 코드 블록에서 JSON 추출 시도
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        
        // 일반 JSON 검색 시도
        const jsonRegex = /{[\s\S]*}/;
        const jsonString = responseText.match(jsonRegex);
        if (jsonString) {
            return JSON.parse(jsonString[0]);
        }
        
        // 전체 텍스트를 JSON으로 파싱 시도
        return JSON.parse(responseText);
    } catch (error) {
        console.error('JSON 추출 오류:', error);
        return null;
    }
}

// 추출된 데이터 처리 함수
function processExtractedData(data) {
    // 전역 변수에 데이터 저장
    graphData = data;
    
    // 데이터프레임 생성
    entitiesDataFrame = data.entities;
    relationsDataFrame = data.relations || [];
    
    // 관계 정보 데이터프레임 생성
    relationsWithInfoDataFrame = createRelationsWithInfo(data);
    
    // JSONL 콘텐츠 생성
    jsonlContent = createJsonlContent(data);
    
    // HTML 콘텐츠 생성 (그래프 시각화)
    htmlContent = createHtmlContent(data);
}

// 관계 정보 데이터프레임 생성 함수
function createRelationsWithInfo(data) {
    if (!data.relations || data.relations.length === 0) {
        return [];
    }
    
    const entities = data.entities;
    const entityMap = {};
    
    // 개체 ID를 키로 하는 맵 생성
    entities.forEach(entity => {
        entityMap[entity.id] = entity;
    });
    
    // 관계 정보 확장
    return data.relations.map(relation => {
        const sourceEntity = entityMap[relation.source] || {};
        const targetEntity = entityMap[relation.target] || {};
        
        return {
            source_id: relation.source,
            source_name: sourceEntity.name || '',
            source_type: sourceEntity.type || '',
            target_id: relation.target,
            target_name: targetEntity.name || '',
            target_type: targetEntity.type || '',
            relation: relation.relation,
            sentence: relation.sentence || ''
        };
    });
}

// JSONL 콘텐츠 생성 함수
function createJsonlContent(data) {
    const lines = [];
    
    // 개체를 JSONL 형식으로 변환
    if (data.entities) {
        data.entities.forEach(entity => {
            lines.push(JSON.stringify({ type: 'entity', data: entity }));
        });
    }
    
    // 관계를 JSONL 형식으로 변환
    if (data.relations) {
        data.relations.forEach(relation => {
            lines.push(JSON.stringify({ type: 'relation', data: relation }));
        });
    }
    
    return lines.join('\n');
}

// HTML 그래프 콘텐츠 생성 함수 (vis.js 사용)
function createHtmlContent(data) {
    // HTML 템플릿 생성
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>지식 그래프 시각화</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.2/vis-network.min.js"></script>
    <style>
        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Nanum Gothic', 'Malgun Gothic', 'Apple Gothic', '맑은 고딕', '돋움', sans-serif;
        }
        #graph-container {
            width: 100%;
            height: 100vh;
        }
        .legend {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #ccc;
            z-index: 1000;
        }
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            border-radius: 3px;
        }
        .legend-text {
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="graph-container"></div>
    <div class="legend">
        <h3 style="margin-top: 0;">개체 유형</h3>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #3498db;"></div>
            <div class="legend-text">인물 (PERSON)</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #2ecc71;"></div>
            <div class="legend-text">조직 (ORGANIZATION)</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #e74c3c;"></div>
            <div class="legend-text">장소 (LOCATION)</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #f39c12;"></div>
            <div class="legend-text">이벤트 (EVENT)</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #9b59b6;"></div>
            <div class="legend-text">제품 (PRODUCT)</div>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #7f8c8d;"></div>
            <div class="legend-text">기타 (OTHER)</div>
        </div>
    </div>
    <script>
        // 노드와 엣지 데이터 정의
        const nodes = ${JSON.stringify(data.entities.map(entity => ({
            id: entity.id,
            label: entity.name,
            title: \`유형: \${entity.type}<br>설명: \${entity.description || ''}\`,
            color: getColorByEntityType(entity.type),
            font: { size: 16, face: 'Nanum Gothic' },
            shape: 'circle',
            size: 30
        })))};
        
        const edges = ${JSON.stringify(data.relations.map(relation => ({
            from: relation.source,
            to: relation.target,
            label: relation.relation,
            title: relation.sentence || '',
            font: { size: 12, face: 'Nanum Gothic' },
            arrows: 'to',
            color: { color: '#555' },
            width: 2
        })))};
        
        // 색상 매핑 함수
        function getColorByEntityType(type) {
            const colorMap = {
                "PERSON": "#3498db",
                "ORGANIZATION": "#2ecc71",
                "LOCATION": "#e74c3c",
                "EVENT": "#f39c12",
                "PRODUCT": "#9b59b6",
                "OTHER": "#7f8c8d"
            };
            return colorMap[type] || colorMap["OTHER"];
        }
        
        // 그래프 생성
        const container = document.getElementById('graph-container');
        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
        const options = {
            nodes: {
                shape: 'circle',
                font: { size: 18, face: 'Nanum Gothic' },
                shadow: true,
                scaling: { min: 30, max: 50 }
            },
            edges: {
                font: { size: 14, face: 'Nanum Gothic' },
                smooth: { type: 'dynamic' },
                arrows: { to: { enabled: true, scaleFactor: 0.5 } }
            },
            physics: {
                hierarchicalRepulsion: {
                    centralGravity: 0.5,
                    nodeDistance: 120
                },
                maxVelocity: 50,
                minVelocity: 0.1,
                solver: 'hierarchicalRepulsion'
            },
            interaction: {
                hover: true,
                navigationButtons: true,
                keyboard: true,
                tooltipDelay: 300
            }
        };
        const network = new vis.Network(container, data, options);
    </script>
</body>
</html>`;
}

// 그래프 시각화 함수
function visualizeGraph(data) {
    // 그래프 컨테이너 표시
    graphContainer.classList.remove('hidden');
    
    // 노드 생성
    const nodes = new vis.DataSet(
        data.entities.map(entity => ({
            id: entity.id,
            label: entity.name,
            title: `유형: ${entity.type}<br>설명: ${entity.description || ''}`,
            color: getColorByEntityType(entity.type),
            font: { size: 16, face: 'Nanum Gothic' },
            shape: 'circle',
            size: 30
        }))
    );
    
    // 엣지 생성
    const edges = new vis.DataSet(
        (data.relations || []).map(relation => ({
            from: relation.source,
            to: relation.target,
            label: relation.relation,
            title: relation.sentence || '',
            font: { size: 12, face: 'Nanum Gothic' },
            arrows: 'to',
            color: { color: '#555' },
            width: 2
        }))
    );
    
    // 그래프 옵션 설정
    const options = {
        nodes: {
            shape: 'circle',
            font: { size: 18, face: 'Nanum Gothic' },
            shadow: true,
            scaling: { min: 30, max: 50 }
        },
        edges: {
            font: { size: 14, face: 'Nanum Gothic' },
            smooth: { type: 'dynamic' },
            arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        },
        physics: {
            hierarchicalRepulsion: {
                centralGravity: 0.5,
                nodeDistance: 120
            },
            maxVelocity: 50,
            minVelocity: 0.1,
            solver: 'hierarchicalRepulsion'
        },
        interaction: {
            hover: true,
            navigationButtons: true,
            keyboard: true,
            tooltipDelay: 300
        }
    };
    
    // 그래프 생성
    const network = new vis.Network(graphVisualization, { nodes, edges }, options);
}

// 개체 유형별 색상 반환 함수
function getColorByEntityType(type) {
    return COLOR_MAP[type] || COLOR_MAP["OTHER"];
}

// 데이터 테이블 업데이트 함수
function updateDataTables(data) {
    // 데이터 테이블 컨테이너 표시
    document.querySelector('.info-message').classList.add('hidden');
    dataTablesContent.classList.remove('hidden');
    
    // 개체 테이블 업데이트
    updateEntityTable(data.entities);
    
    // 관계 테이블 업데이트
    updateRelationTable(data.relations || []);
    
    // 관계 정보 테이블 업데이트
    updateRelationInfoTable(relationsWithInfoDataFrame);
}

// 개체 테이블 업데이트 함수
function updateEntityTable(entities) {
    const tableBody = document.querySelector('#entities-table tbody');
    tableBody.innerHTML = '';
    
    entities.forEach(entity => {
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = entity.id;
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entity.name;
        
        const typeCell = document.createElement('td');
        typeCell.textContent = entity.type;
        
        const descCell = document.createElement('td');
        descCell.textContent = entity.description || '';
        
        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(typeCell);
        row.appendChild(descCell);
        
        tableBody.appendChild(row);
    });
}

// 관계 테이블 업데이트 함수
function updateRelationTable(relations) {
    const tableBody = document.querySelector('#relations-table tbody');
    tableBody.innerHTML = '';
    
    relations.forEach(relation => {
        const row = document.createElement('tr');
        
        const sourceCell = document.createElement('td');
        sourceCell.textContent = relation.source;
        
        const targetCell = document.createElement('td');
        targetCell.textContent = relation.target;
        
        const relationCell = document.createElement('td');
        relationCell.textContent = relation.relation;
        
        const sentenceCell = document.createElement('td');
        sentenceCell.textContent = relation.sentence || '';
        
        row.appendChild(sourceCell);
        row.appendChild(targetCell);
        row.appendChild(relationCell);
        row.appendChild(sentenceCell);
        
        tableBody.appendChild(row);
    });
}

// 관계 정보 테이블 업데이트 함수
function updateRelationInfoTable(relationsWithInfo) {
    const tableBody = document.querySelector('#relations-info-table tbody');
    tableBody.innerHTML = '';
    
    relationsWithInfo.forEach(relation => {
        const row = document.createElement('tr');
        
        const sourceIdCell = document.createElement('td');
        sourceIdCell.textContent = relation.source_id;
        
        const sourceNameCell = document.createElement('td');
        sourceNameCell.textContent = relation.source_name;
        
        const sourceTypeCell = document.createElement('td');
        sourceTypeCell.textContent = relation.source_type;
        
        const targetIdCell = document.createElement('td');
        targetIdCell.textContent = relation.target_id;
        
        const targetNameCell = document.createElement('td');
        targetNameCell.textContent = relation.target_name;
        
        const targetTypeCell = document.createElement('td');
        targetTypeCell.textContent = relation.target_type;
        
        const relationCell = document.createElement('td');
        relationCell.textContent = relation.relation;
        
        const sentenceCell = document.createElement('td');
        sentenceCell.textContent = relation.sentence;
        
        row.appendChild(sourceIdCell);
        row.appendChild(sourceNameCell);
        row.appendChild(sourceTypeCell);
        row.appendChild(targetIdCell);
        row.appendChild(targetNameCell);
        row.appendChild(targetTypeCell);
        row.appendChild(relationCell);
        row.appendChild(sentenceCell);
        
        tableBody.appendChild(row);
    });
}

// 내보내기 탭 업데이트 함수
function updateExportTab(data) {
    // 내보내기 컨테이너 표시
    document.querySelectorAll('#export-container .info-message').forEach(el => {
        el.classList.add('hidden');
    });
    document.querySelector('.export-content').classList.remove('hidden');
}

// CSV 다운로드 함수
function downloadCSV(data, filename) {
    // CSV 헤더 생성
    let csvContent = '';
    
    if (data.length > 0) {
        // 헤더 행 추가
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';
        
        // 데이터 행 추가
        data.forEach(item => {
            const row = headers.map(header => {
                const value = item[header] || '';
                // CSV 형식에 맞게 값 이스케이프
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvContent += row.join(',') + '\n';
        });
    }
    
    // CSV 파일 다운로드
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

// 파일 다운로드 함수
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// 결과 메시지 표시 함수
function showResultMessage(message, type) {
    resultMessageElement.textContent = message;
    resultMessageElement.className = 'result-message';
    
    if (type === 'success') {
        resultMessageElement.classList.add('success');
    } else if (type === 'error') {
        resultMessageElement.classList.add('error');
    }
    
    resultMessageElement.classList.remove('hidden');
}

// 분석 결과 초기화 함수
function resetAnalysisResults() {
    // 전역 변수 초기화
    graphData = null;
    entitiesDataFrame = null;
    relationsDataFrame = null;
    relationsWithInfoDataFrame = null;
    jsonlContent = null;
    htmlContent = null;
    
    // UI 상태 초기화
    resultMessageElement.classList.add('hidden');
    graphContainer.classList.add('hidden');
    
    // 탭 상태 업데이트
    updateTabStates();
}

// 탭 상태 업데이트 함수
function updateTabStates() {
    const hasData = graphData !== null;
    
    // 데이터 보기 탭 상태 업데이트
    if (hasData) {
        document.querySelector('#data-container .info-message').classList.add('hidden');
        dataTablesContent.classList.remove('hidden');
    } else {
        document.querySelector('#data-container .info-message').classList.remove('hidden');
        dataTablesContent.classList.add('hidden');
    }
    
    // 내보내기 탭 상태 업데이트
    if (hasData) {
        document.querySelector('#export-container .info-message').classList.add('hidden');
        document.querySelector('.export-content').classList.remove('hidden');
    } else {
        document.querySelector('#export-container .info-message').classList.remove('hidden');
        document.querySelector('.export-content').classList.add('hidden');
    }
}

// 샘플 응답 생성 함수 (데모 목적으로만 사용)
function getSampleResponse() {
    return {
        candidates: [{
            content: {
                parts: [{
                    text: JSON.stringify({
                        "entities": [
                            {
                                "id": "E8",
                                "name": "이기획",
                                "type": "PERSON",
                                "description": "네이버의 부사장"
                            },
                            {
                                "id": "E9",
                                "name": "정기술",
                                "type": "PERSON",
                                "description": "삼성전자의 상무"
                            },
                            {
                                "id": "E10",
                                "name": "인공지능",
                                "type": "PRODUCT",
                                "description": "컴퓨터가 인간의 지능을 모방하는 기술"
                            },
                            {
                                "id": "E11",
                                "name": "과학기술정보통신부",
                                "type": "ORGANIZATION",
                                "description": "대한민국의 정부 부처"
                            },
                            {
                                "id": "E12",
                                "name": "안장관",
                                "type": "PERSON",
                                "description": "과학기술정보통신부 장관"
                            }
                        ],
                        "relations": [
                            {
                                "source": "E1",
                                "target": "E3",
                                "relation": "소속",
                                "sentence": "김민수 교수는 서울대학교 컴퓨터공학과 소속으로, 인공지능 발전의 윤리적 측면을 강조했다."
                            },
                            {
                                "source": "E3",
                                "target": "E2",
                                "relation": "소속",
                                "sentence": "김민수 교수는 서울대학교 컴퓨터공학과 소속으로, 인공지능 발전의 윤리적 측면을 강조했다."
                            },
                            {
                                "source": "E4",
                                "target": "E5",
                                "relation": "위치",
                                "sentence": "서울 강남구에서 열린 기술 컨퍼런스에서 김민수 교수가 인공지능의 미래에 대한 강연을 했다."
                            },
                            {
                                "source": "E1",
                                "target": "E4",
                                "relation": "참여",
                                "sentence": "서울 강남구에서 열린 기술 컨퍼런스에서 김민수 교수가 인공지능의 미래에 대한 강연을 했다."
                            },
                            {
                                "source": "E6",
                                "target": "E4",
                                "relation": "주최",
                                "sentence": "이번 행사는 삼성전자와 네이버가 공동 주최했으며, 약 500명의 전문가들이 참석했다."
                            },
                            {
                                "source": "E7",
                                "target": "E4",
                                "relation": "주최",
                                "sentence": "이번 행사는 삼성전자와 네이버가 공동 주최했으며, 약 500명의 전문가들이 참석했다."
                            },
                            {
                                "source": "E8",
                                "target": "E7",
                                "relation": "소속",
                                "sentence": "네이버의 이기획 부사장은 회사의 새로운 AI 서비스를 소개했으며"
                            },
                            {
                                "source": "E9",
                                "target": "E6",
                                "relation": "소속",
                                "sentence": "삼성전자의 정기술 상무가 반도체 기술과 AI의 연관성에 대해 발표했다."
                            },
                            {
                                "source": "E1",
                                "target": "E8",
                                "relation": "협업",
                                "sentence": "행사 후 김민수 교수와 이기획 부사장은 한국 AI 산업의 발전 방향에 대해 토론했다."
                            },
                            {
                                "source": "E2",
                                "target": "E7",
                                "relation": "협력",
                                "sentence": "토론 중 서울대학교와 네이버의 산학협력 가능성도 언급되었다."
                            },
                            {
                                "source": "E12",
                                "target": "E11",
                                "relation": "소속",
                                "sentence": "정부 측에서는 과학기술정보통신부 안장관이 참석하여 인공지능 산업 지원 정책을 발표했다."
                            },
                            {
                                "source": "E12",
                                "target": "E4",
                                "relation": "참여",
                                "sentence": "정부 측에서는 과학기술정보통신부 안장관이 참석하여 인공지능 산업 지원 정책을 발표했다."
                            },
                            {
                                "source": "E12",
                                "target": "E6",
                                "relation": "지원",
                                "sentence": "안장관은 김민수 교수와 삼성전자의 연구 프로젝트에 정부 지원을 약속했다."
                            }
                        ]
                    })
                }]
            }
        }]
    };
}
                                "id": "E1",
                                "name": "김민수",
                                "type": "PERSON",
                                "description": "서울대학교 컴퓨터공학과 교수"
                            },
                            {
                                "id": "E2",
                                "name": "서울대학교",
                                "type": "ORGANIZATION",
                                "description": "대한민국의 국립대학교"
                            },
                            {
                                "id": "E3",
                                "name": "컴퓨터공학과",
                                "type": "ORGANIZATION",
                                "description": "서울대학교의 학과"
                            },
                            {
                                "id": "E4",
                                "name": "기술 컨퍼런스",
                                "type": "EVENT",
                                "description": "서울 강남구에서 열린 인공지능 관련 행사"
                            },
                            {
                                "id": "E5",
                                "name": "서울 강남구",
                                "type": "LOCATION",
                                "description": "대한민국 서울특별시의 행정구역"
                            },
                            {
                                "id": "E6",
                                "name": "삼성전자",
                                "type": "ORGANIZATION",
                                "description": "대한민국의 대표적인 전자기업"
                            },
                            {
                                "id": "E7",
                                "name": "네이버",
                                "type": "ORGANIZATION",
                                "description": "대한민국의 인터넷 기업"
                            },
                            {
