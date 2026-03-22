export const JOB_ONTOLOGY_ITEM = {
  vertical: "IT_DATA_DIGITAL",
  subVertical: "MOBILE_DEVELOPMENT",
  aliases: [
    "모바일 개발자",
    "앱 개발자",
    "iOS 개발자",
    "안드로이드 개발자",
    "Android Developer",
    "iOS Developer",
    "Mobile Engineer",
    "앱 엔지니어",
    "모바일 소프트웨어 엔지니어",
    "모바일 앱 엔지니어"
  ],
  families: [
    {
      id: "NATIVE_APP_DEVELOPMENT",
      label: "네이티브 앱 개발",
      aliases: [
        "iOS 네이티브 개발",
        "Android 네이티브 개발",
        "Swift 개발",
        "Kotlin 개발",
        "Objective-C 개발",
        "Android SDK 개발",
        "iOS SDK 개발"
      ],
      strongSignals: [
        "Swift, Kotlin, Objective-C 사용 경험",
        "Xcode 또는 Android Studio 기반 개발",
        "iOS SDK, Android SDK 직접 활용",
        "앱스토어/플레이스토어 배포 경험",
        "네이티브 UI 컴포넌트 직접 구현"
      ],
      mediumSignals: [
        "앱 성능 최적화 경험",
        "앱 라이프사이클 이해",
        "푸시 알림, 위치, 카메라 등 디바이스 기능 연동",
        "앱 크래시 분석 및 대응 경험"
      ],
      boundarySignals: [
        "React Native, Flutter 중심이면 크로스플랫폼으로 이동",
        "백엔드 API 설계/구현 비중이 커지면 백엔드 개발로 이동",
        "웹뷰 중심 구현이면 하이브리드 앱 개발로 이동"
      ],
      adjacentFamilies: ["CROSS_PLATFORM_DEVELOPMENT", "HYBRID_APP_DEVELOPMENT"],
      boundaryNote: "네이티브 SDK를 직접 다루는 비중이 핵심입니다. 프레임워크 의존이 높아지면 크로스플랫폼으로, 웹 기반 렌더링이 중심이면 하이브리드로 해석될 수 있습니다.",
      summaryTemplate: "이 직무는 iOS 또는 Android 플랫폼의 SDK를 직접 활용해 앱을 구현하는 네이티브 개발 성격이 강합니다. 반면 프레임워크 의존이 높아지면 크로스플랫폼 경계로 읽힐 수 있습니다."
    },
    {
      id: "CROSS_PLATFORM_DEVELOPMENT",
      label: "크로스플랫폼 앱 개발",
      aliases: [
        "React Native 개발자",
        "Flutter 개발자",
        "크로스플랫폼 앱 개발",
        "멀티플랫폼 앱 개발",
        "React Native Engineer",
        "Flutter Engineer"
      ],
      strongSignals: [
        "React Native, Flutter 사용 경험",
        "단일 코드베이스로 iOS/Android 동시 대응",
        "Dart 또는 JavaScript 기반 앱 개발",
        "플랫폼 간 공통 UI/로직 설계 경험"
      ],
      mediumSignals: [
        "네이티브 모듈 브릿지 연동 경험",
        "플랫폼별 차이 대응 로직 구현",
        "앱 번들 사이즈 및 성능 최적화 경험"
      ],
      boundarySignals: [
        "Swift/Kotlin 중심 구현이면 네이티브 개발로 이동",
        "웹 기술 기반(WebView) 중심이면 하이브리드로 이동",
        "UI보다 상태관리/아키텍처 설계 비중이 커지면 앱 아키텍처 역할로 확장"
      ],
      adjacentFamilies: ["NATIVE_APP_DEVELOPMENT", "HYBRID_APP_DEVELOPMENT"],
      boundaryNote: "단일 코드베이스 유지가 핵심입니다. 플랫폼별 네이티브 구현 비중이 커지면 네이티브 개발로, 웹 렌더링 중심이면 하이브리드로 해석됩니다.",
      summaryTemplate: "이 직무는 하나의 코드베이스로 여러 플랫폼을 대응하는 크로스플랫폼 개발 성격이 강합니다. 반면 플랫폼별 네이티브 구현 비중이 커지면 네이티브 경계로 이동할 수 있습니다."
    },
    {
      id: "HYBRID_APP_DEVELOPMENT",
      label: "하이브리드 앱 개발",
      aliases: [
        "하이브리드 앱 개발자",
        "웹뷰 앱 개발",
        "Cordova 개발",
        "Ionic 개발",
        "웹앱 기반 모바일 개발"
      ],
      strongSignals: [
        "WebView 기반 앱 구조",
        "HTML/CSS/JavaScript 중심 앱 구현",
        "웹앱을 모바일 앱으로 래핑",
        "Cordova, Ionic 등 사용 경험"
      ],
      mediumSignals: [
        "웹과 앱 간 브릿지 인터페이스 구현",
        "모바일 브라우저/웹뷰 최적화 경험",
        "앱 배포 및 웹 업데이트 연동"
      ],
      boundarySignals: [
        "React Native/Flutter 사용 시 크로스플랫폼으로 이동",
        "네이티브 SDK 직접 활용 비중 증가 시 네이티브 개발로 이동",
        "웹 서비스 자체 개발 비중이 커지면 프론트엔드 웹 개발로 이동"
      ],
      adjacentFamilies: ["CROSS_PLATFORM_DEVELOPMENT", "NATIVE_APP_DEVELOPMENT"],
      boundaryNote: "웹 기술 중심 렌더링이 핵심입니다. 네이티브 API 직접 활용이 늘어나면 네이티브로, 프레임워크 기반 멀티플랫폼이면 크로스플랫폼으로 이동합니다.",
      summaryTemplate: "이 직무는 웹 기술을 기반으로 모바일 앱을 구현하는 하이브리드 성격이 강합니다. 반면 네이티브 기능 활용이 커지면 네이티브 개발로 해석될 수 있습니다."
    }
  ],
  roles: [
    {
      id: "IOS_ENGINEER",
      label: "iOS 개발자",
      aliases: ["iOS Engineer", "Swift 개발자", "아이폰 앱 개발자"],
      family: "NATIVE_APP_DEVELOPMENT",
      responsibilityHints: [
        "iOS 앱 기능 구현",
        "UIKit 또는 SwiftUI 기반 UI 개발",
        "앱스토어 배포 및 유지보수"
      ],
      levelHints: [
        "주니어: 기능 단위 구현 중심",
        "미드: 모듈 설계 및 성능 개선",
        "시니어: 아키텍처 설계 및 기술 선택 주도"
      ]
    },
    {
      id: "ANDROID_ENGINEER",
      label: "안드로이드 개발자",
      aliases: ["Android Engineer", "Kotlin 개발자", "안드로이드 앱 개발자"],
      family: "NATIVE_APP_DEVELOPMENT",
      responsibilityHints: [
        "Android 앱 기능 구현",
        "Jetpack 및 Android SDK 활용",
        "플레이스토어 배포 및 유지보수"
      ],
      levelHints: [
        "주니어: 화면/기능 구현",
        "미드: 아키텍처 및 상태관리 설계",
        "시니어: 앱 성능 및 구조 개선 주도"
      ]
    },
    {
      id: "REACT_NATIVE_ENGINEER",
      label: "React Native 개발자",
      aliases: ["React Native Engineer", "RN 개발자"],
      family: "CROSS_PLATFORM_DEVELOPMENT",
      responsibilityHints: [
        "React Native 기반 앱 개발",
        "플랫폼 공통 UI/로직 설계",
        "네이티브 모듈 연동"
      ],
      levelHints: [
        "주니어: 컴포넌트 구현 중심",
        "미드: 상태관리 및 구조 설계",
        "시니어: 플랫폼 간 전략 및 성능 최적화"
      ]
    },
    {
      id: "FLUTTER_ENGINEER",
      label: "Flutter 개발자",
      aliases: ["Flutter Engineer", "Dart 개발자"],
      family: "CROSS_PLATFORM_DEVELOPMENT",
      responsibilityHints: [
        "Flutter 기반 앱 개발",
        "위젯 기반 UI 구성",
        "플랫폼 공통 코드 설계"
      ],
      levelHints: [
        "주니어: UI/기능 구현",
        "미드: 상태관리 및 구조 설계",
        "시니어: 앱 아키텍처 및 성능 최적화"
      ]
    },
    {
      id: "HYBRID_APP_ENGINEER",
      label: "하이브리드 앱 개발자",
      aliases: ["Hybrid App Developer", "웹뷰 앱 개발자"],
      family: "HYBRID_APP_DEVELOPMENT",
      responsibilityHints: [
        "웹 기반 앱을 모바일로 래핑",
        "WebView 환경 최적화",
        "웹-앱 브릿지 구현"
      ],
      levelHints: [
        "주니어: 화면 및 기능 구현",
        "미드: 웹-앱 인터페이스 설계",
        "시니어: 앱 구조 및 배포 전략 설계"
      ]
    }
  ],
  axes: [
    {
      axisId: "PLATFORM_STRATEGY",
      label: "플랫폼 대응 방식",
      values: [
        "네이티브 개별 개발",
        "크로스플랫폼 단일 코드베이스",
        "웹 기반 하이브리드"
      ]
    },
    {
      axisId: "SDK_DEPENDENCY",
      label: "플랫폼 SDK 직접 활용 수준",
      values: [
        "SDK 직접 활용 높음",
        "프레임워크 간접 활용",
        "웹 기술 중심"
      ]
    }
  ],
  adjacentFamilies: [
    "FRONTEND_WEB_DEVELOPMENT",
    "BACKEND_DEVELOPMENT",
    "EMBEDDED_SOFTWARE"
  ],
  boundaryHints: [
    "Swift/Kotlin 기반 구현 비중이 높아지면 네이티브 앱 개발로 해석됩니다",
    "React Native, Flutter 중심이면 크로스플랫폼으로 이동합니다",
    "WebView 및 웹 코드 비중이 커지면 하이브리드 앱 개발로 읽힙니다",
    "API 설계 및 서버 로직 비중이 커지면 백엔드 개발로 이동합니다",
    "웹 UI 개발 중심이면 프론트엔드 웹 개발로 해석될 수 있습니다"
  ],
  summaryTemplate: "이 직무는 모바일 앱을 구현하는 역할로, 플랫폼 대응 방식에 따라 네이티브, 크로스플랫폼, 하이브리드로 구분됩니다. 사용하는 기술 스택과 플랫폼 SDK 활용 수준에 따라 세부 경계가 달라질 수 있습니다."
};