import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-5 w-5" />
          뒤로 가기
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">개인정보 처리방침</CardTitle>
            <p className="text-sm text-gray-500">최종 수정일: 2025년 1월</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. 수집하는 개인정보</h2>
              <p className="mb-2">습관 트래커는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>이메일 주소 (계정 생성 및 로그인용)</li>
                <li>사용자 이름 및 표시명</li>
                <li>습관 기록 데이터 (습관 이름, 완료 여부, 메모 등)</li>
                <li>푸시 알림 토큰 (알림 전송용)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. 개인정보의 이용 목적</h2>
              <p className="mb-2">수집된 개인정보는 다음의 목적을 위해 사용됩니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>서비스 제공 및 유지관리</li>
                <li>사용자 인증 및 계정 관리</li>
                <li>그룹 구성원 간 습관 공유 기능 제공</li>
                <li>습관 완료 시 푸시 알림 전송</li>
                <li>월간 통계 및 분석 제공</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. 개인정보의 보관 기간</h2>
              <p className="text-gray-700">
                회원님의 개인정보는 회원 탈퇴 시까지 보관되며, 탈퇴 즉시 모든 데이터가 삭제됩니다.
                다만, 관련 법령에 의해 보관이 필요한 경우 해당 기간 동안 보관될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
              <p className="text-gray-700">
                습관 트래커는 회원님의 개인정보를 제3자에게 제공하지 않습니다.
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
                <li>회원님의 사전 동의가 있는 경우</li>
                <li>법령에 의해 요구되는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. 개인정보의 파기 절차 및 방법</h2>
              <p className="text-gray-700">
                회원 탈퇴 또는 개인정보 보유 기간이 종료된 경우, 지체 없이 해당 개인정보를 파기합니다.
                전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법으로 영구 삭제됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. 개인정보 보호를 위한 기술적/관리적 대책</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>HTTPS 암호화 통신을 통한 안전한 데이터 전송</li>
                <li>비밀번호 암호화 저장</li>
                <li>JWT 토큰 기반 인증 시스템</li>
                <li>정기적인 보안 업데이트</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. 회원의 권리</h2>
              <p className="mb-2">회원님은 언제든지 다음과 같은 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정 요구</li>
                <li>개인정보 삭제 요구 (회원 탈퇴)</li>
                <li>개인정보 처리 정지 요구</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. 개인정보 보호책임자</h2>
              <div className="text-gray-700">
                <p className="mb-2">개인정보 처리에 관한 문의사항이 있으시면 아래로 연락해 주시기 바랍니다:</p>
                <p className="font-medium">이메일: omj1010@naver.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. 개인정보 처리방침의 변경</h2>
              <p className="text-gray-700">
                본 개인정보 처리방침은 법령 및 정책에 따라 변경될 수 있으며,
                변경 시 앱 공지사항을 통해 안내드립니다.
              </p>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">
                본 개인정보 처리방침은 2025년 1월부터 적용됩니다.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
