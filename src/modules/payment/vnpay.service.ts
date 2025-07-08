import { Injectable } from '@nestjs/common';
import { CreatePaymentUrlDto } from './dto/create-payment-url.dto';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import * as qs from 'qs';
import * as crypto from 'crypto';
import { VNPayCallbackDto } from './dto/vnpay-callback.dto';

@Injectable()
export class VNPayService {
  private readonly vnpUrl: string;
  private readonly vnpTmnCode: string;
  private readonly vnpHashSecret: string;
  private readonly vnpReturnUrl: string;

  constructor(private configService: ConfigService) {
    this.vnpUrl =
      this.configService.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnpTmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    this.vnpHashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
    this.vnpReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL');
  }

  private sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  private getResponseMessage(responseCode: string): string {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }

  createPaymentUrl(paymentData: CreatePaymentUrlDto) {
    const createDate = dayjs().format('YYYYMMDDHHmmss');
    const expireDate = dayjs().add(10, 'minutes').format('YYYYMMDDHHmmss');

    const vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnpTmnCode,
      vnp_Amount: paymentData.amount * 100, // VNPay yêu cầu số tiền nhân với 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentData.orderId,
      vnp_OrderInfo: paymentData.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: paymentData.locale || 'vn',
      vnp_ReturnUrl: paymentData.returnUrl || this.vnpReturnUrl,
      vnp_IpAddr: paymentData.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
      vnp_BankCode: 'VNBANK',
    };

    const sortedParams = this.sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });

    const secureHash = crypto
      .createHmac('sha512', 'MLO7A1KQBOSH24SC9QAHM3Y6LYMZNFT6')
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    sortedParams['vnp_SecureHash'] = secureHash;

    const paymentUrl =
      this.vnpUrl + '?' + qs.stringify(sortedParams, { encode: false });

    return paymentUrl;
  }

  vnpayCallback(vnpParams: VNPayCallbackDto): {
    isValid: boolean;
    responseCode: string;
    message: string;
    data?: any;
  } {
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;

    // Sắp xếp params và tạo lại secure hash
    const sortedParams = this.sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const checkSum = crypto
      .createHmac('sha512', this.vnpHashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    // Kiểm tra tính hợp lệ của secure hash
    if (secureHash !== checkSum) {
      return {
        isValid: false,
        responseCode: '97',
        message: 'Invalid signature',
      };
    }

    // Kiểm tra response code từ VNPay
    const responseCode = vnpParams.vnp_ResponseCode;
    console.log(responseCode);
    if (responseCode === '00') {
      return {
        isValid: true,
        responseCode: '00',
        message: 'Payment successful',
        data: {
          orderId: vnpParams.vnp_TxnRef,
          amount: parseInt(vnpParams.vnp_Amount) / 100,
          bankCode: vnpParams.vnp_BankCode,
          bankTranNo: vnpParams.vnp_BankTranNo,
          cardType: vnpParams.vnp_CardType,
          orderInfo: vnpParams.vnp_OrderInfo,
          payDate: vnpParams.vnp_PayDate,
          transactionNo: vnpParams.vnp_TransactionNo,
        },
      };
    } else {
      return {
        isValid: false,
        responseCode,
        message: this.getResponseMessage(responseCode),
      };
    }
  }
}
