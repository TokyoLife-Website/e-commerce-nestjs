import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { Order } from '../orders/entities/order.entity';
import { formatCurrency } from 'src/common/utils/formatCurrency';

@Injectable()
export class PdfService {
  private browser: puppeteer.Browser | null = null;

  async generateOrderPdf(order: Order): Promise<Buffer> {
    try {
      // Initialize browser if not already done
      if (!this.browser) {
        try {
          this.browser = await puppeteer.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu',
            ],
          });
        } catch (error) {
          console.error('Failed to launch Puppeteer browser:', error);
          throw new Error(
            'PDF generation service is not available. Please check system dependencies.',
          );
        }
      }

      const page = await this.browser.newPage();

      // Generate HTML content
      const htmlContent = await this.generateOrderHtml(order);

      // Set content and wait for fonts to load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        preferCSSPageSize: true,
      });

      await page.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private async generateOrderHtml(order: Order): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'src/modules/pdf/templates/order-invoice.html',
    );

    // Read HTML template
    let htmlTemplate = '';
    try {
      htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      // If template doesn't exist, use inline template
      htmlTemplate = this.getDefaultTemplate();
    }

    // Replace placeholders with actual data
    let htmlContent = htmlTemplate
      .replace(/\{\{orderCode\}\}/g, order.code)
      .replace(
        /\{\{orderDate\}\}/g,
        order.createdAt.toLocaleDateString('vi-VN'),
      )
      .replace(/\{\{orderStatus\}\}/g, order.status.toLowerCase())
      .replace(
        /\{\{customerName\}\}/g,
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
      )
      .replace(/\{\{customerEmail\}\}/g, order.user?.email || '')
      .replace(/\{\{customerPhone\}\}/g, order.user?.phone || '')
      .replace(/\{\{shippingAddress\}\}/g, order.address)
      .replace(
        /\{\{shippingFee\}\}/g,
        formatCurrency(order.shippingFee, 'VND', 'vi-VN'),
      )
      .replace(/\{\{paymentMethod\}\}/g, order.paymentMethod)
      .replace(/\{\{subtotal\}\}/g, formatCurrency(order.total, 'VND', 'vi-VN'))
      .replace(
        /\{\{discount\}\}/g,
        formatCurrency(order.discount, 'VND', 'vi-VN'),
      )
      .replace(
        /\{\{finalAmount\}\}/g,
        formatCurrency(order.finalAmount, 'VND', 'vi-VN'),
      )
      .replace(/\{\{couponCode\}\}/g, order.coupon?.code || '')
      .replace(/\{\{orderItems\}\}/g, this.generateOrderItemsHtml(order.items));

    // Handle conditional sections
    if (order.coupon?.code) {
      htmlContent = htmlContent.replace(
        /\{\{#if couponCode\}\}[\s\S]*?\{\{\/if\}\}/g,
        `<div class="summary-row">
          <span>Coupon Discount:</span>
          <span style="color: #e74c3c;">-${formatCurrency(order.discount, 'VND', 'vi-VN')}</span>
        </div>`,
      );
    } else {
      htmlContent = htmlContent.replace(
        /\{\{#if couponCode\}\}[\s\S]*?\{\{\/if\}\}/g,
        '',
      );
    }

    return htmlContent;
  }

  private generateOrderItemsHtml(items: any[]): string {
    return items
      .map(
        (item) => `
      <tr>
        <td class="text-center">${item.sku?.sku || ''}</td>
        <td>
          <div class="product-info">
            <strong>${item.sku?.product?.name || ''}</strong>
            <small>${item.sku?.color || ''} - ${item.sku?.size || ''}</small>
          </div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.price, 'VND', 'vi-VN')}</td>
        <td class="text-right font-weight-bold">${formatCurrency(item.total, 'VND', 'vi-VN')}</td>
      </tr>
    `,
      )
      .join('');
  }

  private getDefaultTemplate(): string {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Invoice - {{orderCode}}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; background: #fff; font-size: 12px; }
        .container { max-width: 750px; margin: 0 auto; padding: 15px; }
        .header { background: #c92027; color: white; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-align: center; }
        .header h1 { font-size: 1.5em; margin-bottom: 5px; font-weight: 600; }
        .header .subtitle { font-size: 0.9em; opacity: 0.9; }
        .invoice-number { background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 10px; font-size: 0.9em; font-weight: 600; margin-top: 8px; display: inline-block; }
        .invoice-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 3px solid #c92027; }
        .invoice-info h2 { color: #c92027; margin-bottom: 10px; font-size: 1.1em; font-weight: 600; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .info-card { background: white; padding: 12px; border-radius: 5px; border: 1px solid #e9ecef; }
        .info-card h3 { color: #c92027; margin-bottom: 8px; font-size: 1em; font-weight: 600; border-bottom: 1px solid #e9ecef; padding-bottom: 5px; }
        .info-card p { margin-bottom: 4px; font-size: 0.85em; }
        .info-card strong { color: #495057; font-weight: 600; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #cce5ff; color: #004085; }
        .status-shipped { background: #d4edda; color: #155724; }
        .status-delivered { background: #d1ecf1; color: #0c5460; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .products-section { margin: 15px 0; }
        .products-section h2 { color: #c92027; font-size: 1.1em; margin-bottom: 10px; font-weight: 600; }
        .products-table { width: 100%; border-collapse: collapse; background: white; border-radius: 5px; overflow: hidden; border: 1px solid #e9ecef; }
        .products-table th { background: #c92027; color: white; padding: 8px 6px; text-align: left; font-weight: 600; font-size: 0.8em; text-transform: uppercase; }
        .products-table td { padding: 8px 6px; border-bottom: 1px solid #e9ecef; font-size: 0.8em; }
        .products-table tr:nth-child(even) { background: #f8f9fa; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-weight-bold { font-weight: 600; }
        .text-muted { color: #6c757d; }
        .product-info strong { display: block; margin-bottom: 2px; font-size: 0.85em; }
        .product-info small { color: #6c757d; font-size: 0.75em; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px; border: 1px solid #dee2e6; }
        .summary h2 { color: #c92027; margin-bottom: 10px; font-size: 1.1em; font-weight: 600; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 4px 0; font-size: 0.85em; }
        .summary-total { border-top: 2px solid #c92027; padding-top: 8px; margin-top: 8px; font-size: 1em; font-weight: 700; color: #c92027; background: rgba(201, 32, 39, 0.1); padding: 8px; border-radius: 3px; }
        .footer { background: #2c3e50; color: white; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center; }
        .footer h3 { margin-bottom: 8px; font-size: 1.1em; font-weight: 600; }
        .footer p { opacity: 0.9; font-size: 0.8em; margin-bottom: 3px; }
        .footer p:last-child { margin-top: 8px; opacity: 0.7; font-size: 0.75em; }
        @media print { body { -webkit-print-color-adjust: exact; } .container { max-width: none; padding: 0; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="invoice-number">#{{orderCode}}</div>
          <div class="header-content">
            <h1>TokyoLife</h1>
            <p class="subtitle">Your Trusted Online Shopping Partner</p>
          </div>
        </div>
        <div class="invoice-info">
          <h2>Invoice Information</h2>
          <div class="info-grid">
            <div>
              <p><strong>Invoice #:</strong> {{orderCode}}</p>
              <p><strong>Date:</strong> {{orderDate}}</p>
              <p><strong>Payment:</strong> {{paymentMethod}}</p>
            </div>
            <div>
              <p><strong>Status:</strong> <span class="status-badge status-{{orderStatus}}">{{orderStatus}}</span></p>
              {{#if couponCode}}
              <p><strong>Coupon:</strong> {{couponCode}}</p>
              {{/if}}
            </div>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> {{customerName}}</p>
            <p><strong>Email:</strong> {{customerEmail}}</p>
            <p><strong>Phone:</strong> {{customerPhone}}</p>
          </div>
          <div class="info-card">
            <h3>Shipping Information</h3>
            <p><strong>Address:</strong> {{shippingAddress}}</p>
            <p><strong>Shipping Fee:</strong> ${formatCurrency(0, 'VND', 'vi-VN')}</p>
          </div>
        </div>
        <div class="products-section">
          <h2>Order Items</h2>
          <table class="products-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th class="text-center">Quantity</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {{orderItems}}
            </tbody>
          </table>
        </div>
        <div class="summary">
          <h2>Order Summary</h2>
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(0, 'VND', 'vi-VN')}</span>
          </div>
          {{#if couponCode}}
          <div class="summary-row">
            <span>Coupon Discount:</span>
            <span style="color: #e74c3c;">-${formatCurrency(0, 'VND', 'vi-VN')}</span>
          </div>
          {{/if}}
          <div class="summary-row">
            <span>Shipping:</span>
            <span>${formatCurrency(0, 'VND', 'vi-VN')}</span>
          </div>
          <div class="summary-row summary-total">
            <span>TOTAL:</span>
            <span>${formatCurrency(0, 'VND', 'vi-VN')}</span>
          </div>
        </div>
        <div class="footer">
          <div class="footer-content">
            <h3>Thank you for your business!</h3>
            <p>We appreciate your trust in us and look forward to serving you again.</p>
            <p><strong>TokyoLife</strong></p>
            <p>123 Business Street, City, Country</p>
            <p>Phone: +1 (555) 123-4567 | Email: info@tokyolife.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
