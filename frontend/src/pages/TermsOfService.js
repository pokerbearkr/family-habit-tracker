import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5" />
          뒤로 가기
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">서비스 이용약관</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일: 2024년 12월 14일</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 약관은 가족 습관 트래커(이하 "서비스")의 이용과 관련하여 서비스 제공자와
                이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제2조 (정의)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>"서비스"란 가족 구성원들이 습관을 기록하고 공유할 수 있는 웹 애플리케이션을 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 서비스를 이용하는 회원을 의미합니다.</li>
                <li>"가족 그룹"이란 서비스 내에서 습관을 공유하는 이용자들의 모임을 의미합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제3조 (서비스의 제공)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">서비스는 다음과 같은 기능을 제공합니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>개인 습관 등록 및 완료 기록</li>
                <li>가족 그룹 생성 및 관리</li>
                <li>가족 구성원 간 습관 공유 및 응원</li>
                <li>월간/일간 습관 통계 제공</li>
                <li>푸시 알림을 통한 습관 완료 알림</li>
                <li>건강 기록 관리</li>
                <li>캘린더 일정 관리</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제4조 (회원가입)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>이용자는 서비스가 정한 양식에 따라 회원정보를 기입하여 회원가입을 신청합니다.</li>
                <li>이용자는 정확한 정보를 제공해야 하며, 허위 정보 제공 시 서비스 이용이 제한될 수 있습니다.</li>
                <li>14세 미만의 아동은 법정대리인의 동의를 얻어 가입해야 합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제5조 (이용자의 의무)</h2>
              <p className="mb-2 text-gray-700 dark:text-gray-300">이용자는 다음 행위를 해서는 안 됩니다:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>다른 이용자의 개인정보를 수집하거나 악용하는 행위</li>
                <li>서비스를 이용하여 법령 또는 공서양속에 위반되는 행위</li>
                <li>서비스의 보안을 위협하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제6조 (서비스 제공자의 의무)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서비스의 안정적인 제공을 위해 최선을 다합니다.</li>
                <li>이용자의 개인정보를 보호하고 관련 법령을 준수합니다.</li>
                <li>서비스 장애 발생 시 신속하게 복구합니다.</li>
                <li>이용자의 불만이나 피해 구제 요청을 신속하게 처리합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제7조 (서비스의 변경 및 중단)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서비스는 운영상, 기술상의 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경할 수 있습니다.</li>
                <li>서비스 변경 시 변경 내용과 적용일자를 사전에 공지합니다.</li>
                <li>천재지변, 시스템 장애 등 불가피한 경우 서비스가 일시적으로 중단될 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제8조 (저작권 및 지적재산권)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서비스에 포함된 콘텐츠의 저작권은 서비스 제공자에게 있습니다.</li>
                <li>이용자가 등록한 습관 기록 등의 콘텐츠에 대한 권리는 이용자에게 있습니다.</li>
                <li>이용자는 서비스를 이용하여 얻은 정보를 서비스 제공자의 사전 승낙 없이 상업적으로 이용할 수 없습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제9조 (회원 탈퇴 및 자격 상실)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>이용자는 언제든지 설정 메뉴를 통해 회원 탈퇴를 요청할 수 있습니다.</li>
                <li>탈퇴 시 모든 개인 데이터는 즉시 삭제됩니다.</li>
                <li>본 약관을 위반한 경우 서비스 이용이 제한되거나 회원 자격이 상실될 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제10조 (면책조항)</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서비스는 무료로 제공되며, 서비스 이용으로 인해 발생하는 손해에 대해 법적 책임을 지지 않습니다.</li>
                <li>이용자 간의 분쟁에 대해 서비스 제공자는 개입하지 않으며 책임을 지지 않습니다.</li>
                <li>서비스에 저장된 데이터의 손실에 대해 책임을 지지 않으므로, 중요한 정보는 별도로 백업하시기 바랍니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제11조 (분쟁 해결)</h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 약관에 명시되지 않은 사항 또는 약관의 해석에 관하여 분쟁이 발생한 경우,
                관련 법령 및 상관례에 따라 해결합니다. 분쟁에 대한 소송은 대한민국 법원을 관할 법원으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제12조 (약관의 변경)</h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 약관은 필요에 따라 변경될 수 있으며, 변경된 약관은 서비스 내 공지 후 효력이 발생합니다.
                이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">제13조 (문의)</h2>
              <div className="text-gray-700 dark:text-gray-300">
                <p className="mb-2">서비스 이용에 관한 문의사항이 있으시면 아래로 연락해 주시기 바랍니다:</p>
                <p className="font-medium">이메일: omj1010@naver.com</p>
              </div>
            </section>

            <section className="border-t dark:border-gray-700 pt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                본 이용약관은 2024년 12월 14일부터 적용됩니다.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
