/**
 * DSCITY — Nội dung trợ giúp / điều khoản / bảo mật / giới thiệu (song ngữ).
 *
 * vi/en có sẵn (offline). Ngôn ngữ khác được dịch ONLINE từ bản tiếng Anh
 * qua services/translate.ts (giữ tiếng Anh trong lúc chờ, an toàn lỗi mạng) —
 * cùng cơ chế với i18n.
 */
import { useEffect, useState } from 'react';

import type { Lang } from '@/i18n';
import { translateBatch } from '@/services/translate';

export interface HelpContent {
  faq: { q: string; a: string }[];
  contact: string;
  terms: string[];
  privacy: string[];
  about: string;
}

const CONTENT: Record<'vi' | 'en', HelpContent> = {
  vi: {
    faq: [
      {
        q: 'Làm sao để đặt xe hoặc bãi đỗ?',
        a: 'Chọn dịch vụ ở trang chủ, chọn địa điểm hoặc xe, chọn gói thuê rồi xác nhận. Mã đặt chỗ hiển thị ngay sau khi thanh toán.',
      },
      {
        q: 'Tôi có thể huỷ đơn không?',
        a: 'Bạn được miễn phí huỷ trong vòng 1 giờ sau khi đặt. Tiền cọc sẽ được hoàn lại vào ví DSCITY.',
      },
      {
        q: 'Nạp tiền vào ví bằng cách nào?',
        a: 'Vào tab Tài khoản, mở ví và chọn Nạp tiền. Hỗ trợ thẻ VISA/Mastercard và ví MoMo.',
      },
    ],
    contact: 'Hotline 1900 1234 (8:00–22:00) · support@dscity.vn',
    terms: [
      'Khi sử dụng DSCITY, bạn đồng ý tuân thủ các điều khoản dịch vụ và quy định đặt xe, đỗ xe hiện hành.',
      'Người dùng chịu trách nhiệm cung cấp thông tin chính xác và sử dụng dịch vụ đúng mục đích.',
      'DSCITY có quyền tạm ngưng tài khoản vi phạm quy định hoặc có dấu hiệu gian lận.',
      'Mọi tranh chấp được giải quyết theo pháp luật Việt Nam.',
    ],
    privacy: [
      'Chúng tôi thu thập thông tin cơ bản (tên, số điện thoại, vị trí) để cung cấp dịch vụ đặt xe và đỗ xe.',
      'Dữ liệu của bạn được mã hoá và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.',
      'Bạn có thể yêu cầu xoá tài khoản và dữ liệu cá nhân bất kỳ lúc nào trong phần Cài đặt.',
    ],
    about:
      'DSCITY là nền tảng di chuyển thông minh: đặt bãi đỗ xe, thuê ô tô và xe máy, đi chung xe — tất cả trong một ứng dụng.',
  },
  en: {
    faq: [
      {
        q: 'How do I book a vehicle or a parking spot?',
        a: 'Pick a service on the home screen, choose a place or vehicle and a plan, then confirm. Your booking code appears right after payment.',
      },
      {
        q: 'Can I cancel a booking?',
        a: 'Cancellation is free within 1 hour of booking. The deposit is refunded to your DSCITY wallet.',
      },
      {
        q: 'How do I top up my wallet?',
        a: 'Open the Account tab, tap the wallet and choose Top up. VISA/Mastercard and MoMo are supported.',
      },
    ],
    contact: 'Hotline 1900 1234 (8:00–22:00) · support@dscity.vn',
    terms: [
      'By using DSCITY you agree to follow the current service terms and the booking and parking rules.',
      'Users are responsible for providing accurate information and using the service as intended.',
      'DSCITY may suspend accounts that break the rules or show signs of fraud.',
      'Any dispute is resolved under the laws of Vietnam.',
    ],
    privacy: [
      'We collect basic information (name, phone number, location) to provide booking and parking services.',
      'Your data is encrypted and is not shared with third parties without your consent.',
      'You can request deletion of your account and personal data at any time in Settings.',
    ],
    about:
      'DSCITY is a smart mobility platform: book parking, rent cars and motorbikes, and share rides — all in one app.',
  },
};

/**
 * Nội dung theo ngôn ngữ hiện tại.
 * vi/en trả ngay; ngôn ngữ khác dịch online từ bản tiếng Anh (giữ tiếng Anh
 * trong lúc chờ, an toàn lỗi mạng — giống cơ chế của i18n).
 */
export function useHelpContent(lang: Lang): HelpContent {
  const [content, setContent] = useState<HelpContent>(lang === 'vi' ? CONTENT.vi : CONTENT.en);

  useEffect(() => {
    if (lang === 'vi') {
      setContent(CONTENT.vi);
      return;
    }
    if (lang === 'en') {
      setContent(CONTENT.en);
      return;
    }

    let cancelled = false;
    const base = CONTENT.en;
    setContent(base); // hiển thị tiếng Anh trong lúc dịch
    const strings = [
      base.contact,
      base.about,
      ...base.terms,
      ...base.privacy,
      ...base.faq.flatMap((f) => [f.q, f.a]),
    ];
    translateBatch(strings, lang, 'en')
      .then((map) => {
        if (cancelled) return;
        const tr = (s: string) => map[s] ?? s;
        setContent({
          contact: tr(base.contact),
          about: tr(base.about),
          terms: base.terms.map(tr),
          privacy: base.privacy.map(tr),
          faq: base.faq.map((f) => ({ q: tr(f.q), a: tr(f.a) })),
        });
      })
      .catch(() => {
        /* lỗi mạng -> giữ tiếng Anh */
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return content;
}
