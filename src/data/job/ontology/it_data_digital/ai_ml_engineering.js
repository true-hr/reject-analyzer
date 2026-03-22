export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "AI_ML_ENGINEERING",
  aliases: [
    "AI 엔지니어",
    "ML 엔지니어",
    "머신러닝 엔지니어",
    "Machine Learning Engineer",
    "AI Engineer",
    "ML Developer",
    "모델 서빙 엔지니어",
    "AI 플랫폼 엔지니어"
  ],
  families: [
    {
      id: "model_development",
      label: "모델 개발",
      aliases: [
        "머신러닝 모델 개발",
        "ML 모델링",
        "AI 모델 개발",
        "모델 트레이닝"
      ],
      strongSignals: [
        "PyTorch, TensorFlow 기반 모델 학습 경험",
        "모델 성능 개선 (accuracy, F1 등) 반복 실험",
        "피처 엔지니어링 및 데이터 전처리 경험",
        "모델 구조 설계 및 하이퍼파라미터 튜닝",
        "실험 결과 비교 및 모델 선택 경험"
      ],
      mediumSignals: [
        "노트북 기반 실험 (Jupyter, Colab)",
        "데이터셋 구축 및 라벨링 경험",
        "baseline 모델 대비 성능 개선 경험",
        "논문 기반 모델 구현 경험"
      ],
      boundarySignals: [
        "서빙/배포보다는 학습 및 성능 개선 비중이 높음",
        "서비스 연동보다는 실험 중심 작업",
        "데이터 파이프라인보다는 모델 자체에 집중"
      ],
      adjacentFamilies: [
        "mlops_engineering",
        "applied_ai_engineering"
      ],
      boundaryNote: "모델 학습과 성능 개선 비중이 크면 모델 개발로 읽히며, 배포 자동화나 운영 책임이 커지면 MLOps로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 머신러닝 모델을 설계하고 성능을 개선하는 모델 개발 중심 성격이 강합니다. 반면 모델 운영이나 배포 자동화 비중이 커지면 MLOps 영역으로 읽힐 수 있습니다."
    },
    {
      id: "mlops_engineering",
      label: "MLOps / 모델 운영",
      aliases: [
        "MLOps 엔지니어",
        "모델 배포 엔지니어",
        "ML 플랫폼 엔지니어",
        "모델 서빙"
      ],
      strongSignals: [
        "모델 배포 파이프라인 구축 (CI/CD for ML)",
        "모델 버전 관리 및 실험 관리 (MLflow 등)",
        "모델 서빙 API 구축 (FastAPI, Triton 등)",
        "모델 모니터링 및 성능 드리프트 대응",
        "컨테이너 기반 모델 배포 (Docker, Kubernetes)"
      ],
      mediumSignals: [
        "Feature store 구축 경험",
        "배치/실시간 추론 시스템 운영",
        "데이터-모델 파이프라인 자동화",
        "모델 롤백 및 재배포 경험"
      ],
      boundarySignals: [
        "모델 자체 성능 개선보다 운영 안정성 비중이 높음",
        "인프라/플랫폼과 역할 경계가 일부 겹침",
        "데이터 엔지니어링과 파이프라인 일부 중첩"
      ],
      adjacentFamilies: [
        "model_development",
        "platform_ai_engineering"
      ],
      boundaryNote: "모델 배포와 운영 자동화 비중이 커지면 MLOps로 읽히며, 인프라 플랫폼 구축 중심이면 플랫폼 AI 엔지니어링으로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 머신러닝 모델의 배포와 운영, 자동화에 초점을 둔 MLOps 성격이 강합니다. 반면 인프라 플랫폼 구축 비중이 커지면 플랫폼 영역으로 읽힐 수 있습니다."
    },
    {
      id: "applied_ai_engineering",
      label: "응용 AI 엔지니어링",
      aliases: [
        "AI 서비스 개발",
        "AI 응용 개발",
        "AI 기능 개발",
        "AI API 활용 개발"
      ],
      strongSignals: [
        "모델을 서비스 기능으로 통합한 경험",
        "LLM/OpenAI API 활용 기능 구현",
        "추천/검색/분류 기능을 서비스에 적용",
        "API 기반 추론 로직 구현",
        "사용자 기능 단위 AI 적용 경험"
      ],
      mediumSignals: [
        "프롬프트 엔지니어링 경험",
        "간단한 모델 fine-tuning 경험",
        "서비스 API와 모델 연동 경험",
        "AI 기능의 latency 최적화 경험"
      ],
      boundarySignals: [
        "모델 자체 개발보다는 활용 비중이 높음",
        "서비스 기능 구현과 경계가 겹침",
        "플랫폼보다는 제품 기능 중심"
      ],
      adjacentFamilies: [
        "model_development",
        "service_backend"
      ],
      boundaryNote: "모델을 직접 개발하기보다 서비스에 적용하는 비중이 크면 응용 AI로 읽히며, 모델 성능 개선 비중이 커지면 모델 개발로 이동합니다.",
      summaryTemplate: "이 직무는 AI 모델을 활용해 실제 서비스 기능을 구현하는 응용 중심 성격이 강합니다. 반면 모델 자체 성능 개선 비중이 커지면 모델 개발 영역으로 읽힐 수 있습니다."
    },
    {
      id: "platform_ai_engineering",
      label: "AI 플랫폼 엔지니어링",
      aliases: [
        "AI 플랫폼 개발",
        "ML 플랫폼 엔지니어",
        "AI 인프라 엔지니어",
        "모델 플랫폼"
      ],
      strongSignals: [
        "모델 학습/서빙 공통 플랫폼 구축",
        "GPU/분산 학습 환경 설계",
        "멀티 모델 관리 시스템 구축",
        "내부 AI 개발 도구 및 플랫폼 개발",
        "리소스 스케줄링 및 클러스터 관리"
      ],
      mediumSignals: [
        "Kubeflow, Ray 등 ML 플랫폼 사용 경험",
        "대규모 모델 학습 환경 운영",
        "모델 개발 생산성 개선 도구 구축",
        "데이터-모델 통합 플랫폼 경험"
      ],
      boundarySignals: [
        "모델 개발보다는 인프라/플랫폼 비중이 높음",
        "DevOps/Infra와 경계가 겹침",
        "서비스 기능보다는 내부 시스템 중심"
      ],
      adjacentFamilies: [
        "mlops_engineering",
        "platform_backend"
      ],
      boundaryNote: "공통 플랫폼과 인프라 구축 비중이 커지면 AI 플랫폼으로 읽히며, 특정 모델 운영에 집중하면 MLOps로 이동할 수 있습니다.",
      summaryTemplate: "이 직무는 AI 개발을 위한 공통 플랫폼과 인프라를 구축하는 역할 성격이 강합니다. 반면 개별 모델 운영 비중이 커지면 MLOps 영역으로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "ml_engineer",
      label: "ML 엔지니어",
      aliases: [
        "Machine Learning Engineer"
      ],
      family: "model_development",
      responsibilityHints: [
        "모델 학습 및 성능 개선",
        "데이터 전처리 및 피처 엔지니어링",
        "실험 설계 및 결과 비교"
      ],
      levelHints: [
        "모델 성능 개선 경험",
        "다양한 알고리즘 적용 경험"
      ]
    },
    {
      id: "mlops_engineer",
      label: "MLOps 엔지니어",
      aliases: [
        "MLOps Engineer"
      ],
      family: "mlops_engineering",
      responsibilityHints: [
        "모델 배포 및 운영 자동화",
        "모델 모니터링 및 관리",
        "파이프라인 구축"
      ],
      levelHints: [
        "CI/CD 구축 경험",
        "모델 운영 안정화 경험"
      ]
    },
    {
      id: "ai_application_engineer",
      label: "AI 응용 엔지니어",
      aliases: [
        "Applied AI Engineer"
      ],
      family: "applied_ai_engineering",
      responsibilityHints: [
        "AI 기능 서비스 적용",
        "모델 API 연동",
        "AI 기반 기능 개발"
      ],
      levelHints: [
        "실서비스 적용 경험",
        "AI 기능 사용자 영향 이해"
      ]
    },
    {
      id: "ai_platform_engineer",
      label: "AI 플랫폼 엔지니어",
      aliases: [
        "ML Platform Engineer"
      ],
      family: "platform_ai_engineering",
      responsibilityHints: [
        "AI 개발 플랫폼 구축",
        "학습/서빙 환경 설계",
        "리소스 관리 시스템 개발"
      ],
      levelHints: [
        "대규모 시스템 설계 경험",
        "플랫폼 구축 경험"
      ]
    }
  ],
  axes: [
    {
      axisId: "model_vs_system",
      label: "모델 vs 시스템 초점",
      values: [
        "모델 성능 개선 중심",
        "모델 운영/배포 중심",
        "서비스 적용 중심",
        "플랫폼/인프라 중심"
      ]
    },
    {
      axisId: "development_layer",
      label: "개발 레이어",
      values: [
        "모델 알고리즘/실험",
        "서빙/파이프라인",
        "서비스 기능",
        "플랫폼/인프라"
      ]
    },
    {
      axisId: "ownership_scope",
      label: "책임 범위",
      values: [
        "단일 모델 성능",
        "모델 운영 안정성",
        "제품 기능 구현",
        "조직 공통 플랫폼"
      ]
    }
  ],
  adjacentFamilies: [
    "데이터엔지니어링",
    "백엔드개발",
    "데브옵스"
  ],
  boundaryHints: [
    "모델 성능 개선 작업이 많아지면 모델 개발로 읽히며, 배포와 운영 책임이 커지면 MLOps로 이동합니다.",
    "AI 기능을 제품에 적용하는 비중이 커지면 응용 AI로 해석되며, 모델 자체 개선 비중이 커지면 모델 개발로 이동합니다.",
    "공통 플랫폼 구축과 인프라 설계 비중이 커지면 AI 플랫폼으로 읽히며, 특정 모델 운영 중심이면 MLOps로 해석됩니다.",
    "서비스 API와 기능 구현 비중이 커지면 백엔드 개발과 경계가 겹칩니다."
  ],
  summaryTemplate: "이 직무는 머신러닝 모델의 개발, 운영, 적용, 플랫폼 구축 중 어느 영역에 초점을 두는지에 따라 성격이 나뉩니다. 수행 책임 비중에 따라 모델 개발, MLOps, 응용 AI, 플랫폼 영역으로 경계가 이동할 수 있습니다."
};