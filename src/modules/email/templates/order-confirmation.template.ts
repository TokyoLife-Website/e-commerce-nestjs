import { Order } from '../../orders/entities/order.entity';
import { formatCurrency } from 'src/common/utils/formatCurrency';

export const generateOrderEmailTemplate = (orderData: Order) => {
  const { code, paymentMethod, address, items, createdAt, total, user } =
    orderData;

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đơn hàng</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 30px 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .order-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .order-info h3 {
          margin-top: 0;
          color: #495057;
        }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .order-table th,
        .order-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }
        .product-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          margin-right: 15px;
          float: left;
        }
        .product-info {
          display: flex;
          align-items: center;
        }
        .product-details {
          flex: 1;
        }
        .order-table th {
          background-color: #e9ecef;
          font-weight: 600;
        }
        .total-row {
          font-weight: bold;
          font-size: 16px;
          background-color: #f8f9fa;
        }
        .footer {
          background-color: #343a40;
          color: white;
          text-align: center;
          padding: 20px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #c92027;
          color: #fff; 
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
          font-weight: bold;
        }
        .highlight {
          color: #007bff;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛍️ Xác nhận đơn hàng</h1>
          <p>Cảm ơn bạn đã mua hàng!</p>
        </div>
        
        <div class="content">
          <h2>Xin chào ${user.firstName} ${user.lastName}!</h2>
          <p>Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý. Dưới đây là thông tin chi tiết:</p>
          
          <div class="order-info">
            <h3>Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> <span class="highlight">#${code}</span></p>
            <p><strong>Ngày đặt hàng:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
            <p><strong>Phương thức thanh toán:</strong> ${paymentMethod}</p>
            <p><strong>Địa chỉ giao hàng:</strong> ${address.detail}, ${address.ward.name}, ${address.district.name}, ${address.province.name}</p>
          </div>

          <h3>Chi tiết sản phẩm</h3>
          <table class="order-table">
            <thead>
              <tr>
                <th style="width: 50%;">Sản phẩm</th>
                <th style="width: 15%;">Số lượng</th>
                <th style="width: 17.5%;">Đơn giá</th>
                <th style="width: 17.5%;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <div class="product-info">
                      ${
                        item.sku.product.images
                          ? `
                        <img src="${item.sku.product.images[0]}" alt="${item.sku.product.name}" class="product-image" onerror="this.style.display='none'">
                      `
                          : ''
                      }
                      <div class="product-details">
                        <strong>${item.sku.product.name}</strong>
                          ${item.sku.sku ? `<br><small style="color: #999;">SKU: ${item.sku.sku}</small>` : ''}
                          ${item.sku.size ? `<br><small style="color: #555;">Size: ${item.sku.size}</small>` : ''}
                          ${item.sku.color ? `<br><small style="color: #555;">Màu: ${item.sku.color}</small>` : ''}
                      </div>
                    </div>
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
                </tr>
              `,
                )
                .join('')}
              <tr class="total-row">
                <td colspan="3">Tổng cộng</td>
                <td>${formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#"  style="color: #ffffff !important;" class="btn">Theo dõi đơn hàng</a>
          </div>

          <p><strong>Lưu ý:</strong></p>
          <ul>
            <li>Đơn hàng sẽ được xử lý trong vòng 1-2 ngày làm việc</li>
            <li>Bạn sẽ nhận được email thông báo khi đơn hàng được giao</li>
            <li>Nếu có thắc mắc, vui lòng liên hệ hotline: 0373635003</li>
          </ul>
        </div>

        <div class="footer">
          <p>&copy; 2025 Tokyo Life. All rights reserved.</p>
          <p>Email: support@tokyolife.com | Phone: 0373635003</p>
        </div>
      </div>
    </body>
    </html>
    `;
};
