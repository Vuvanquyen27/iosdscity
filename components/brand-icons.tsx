import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { type PaymentMethod } from '@/data/mock';

/**
 * Logo thương hiệu vẽ bằng SVG (react-native-svg) — không phụ thuộc ảnh PNG,
 * nét sắc ở mọi kích thước và tự đổi nền cho hợp chế độ sáng/tối.
 */

/** Logo Google chữ "G" 4 màu. */
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

/** Logo Apple (đơn sắc — đổi màu theo chữ của nút). */
export function AppleIcon({ size = 20, color = '#000000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 512">
      <Path
        fill={color}
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </Svg>
  );
}

/** Logo Visa (wordmark trên thẻ trắng để nổi ở cả 2 chế độ). */
export function VisaIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size * 1.7} height={size * 1.15} viewBox="0 0 48 32">
      <Rect x={0} y={0} width={48} height={32} rx={5} fill="#FFFFFF" />
      <SvgText
        x={24}
        y={22}
        fontSize={17}
        fontWeight="bold"
        fontStyle="italic"
        fill="#1A1F71"
        textAnchor="middle">
        VISA
      </SvgText>
    </Svg>
  );
}

/** Logo Mastercard (2 vòng tròn lồng nhau trên thẻ trắng). */
export function MastercardIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size * 1.7} height={size * 1.15} viewBox="0 0 48 32">
      <Rect x={0} y={0} width={48} height={32} rx={5} fill="#FFFFFF" />
      <Circle cx={20} cy={16} r={9} fill="#EB001B" />
      <Circle cx={28} cy={16} r={9} fill="#F79E1B" />
      <Path d="M24 7.94a9 9 0 0 1 0 16.12 9 9 0 0 1 0-16.12z" fill="#FF5F00" />
    </Svg>
  );
}

/** Logo MoMo (ô bo góc hồng cánh sen, chữ M trắng). */
export function MomoIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x={0} y={0} width={48} height={48} rx={12} fill="#A50064" />
      <SvgText
        x={24}
        y={34}
        fontSize={28}
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle">
        M
      </SvgText>
    </Svg>
  );
}

/** Chọn logo theo phương thức thanh toán; tiền mặt dùng Ionicons. */
export function PaymentMethodIcon({
  method,
  color,
}: {
  method: PaymentMethod;
  color: string;
}) {
  switch (method) {
    case 'MOMO':
      return <MomoIcon size={30} />;
    case 'VISA':
      return <VisaIcon size={22} />;
    case 'Mastercard':
      return <MastercardIcon size={22} />;
    default:
      return <Ionicons name="cash-outline" size={20} color={color} />;
  }
}
