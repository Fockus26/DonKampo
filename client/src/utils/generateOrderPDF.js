import axios from "axios";
import getFetch from "./getFetch";
import { getShippingCost} from "./getDataByUserType";
import formatPrice from "./formatPrice";
import { isString } from "antd/es/button";
import { jsPDF } from 'jspdf';

const generateOrderPDF = async orderId => {
    try {
        // Llamar a la API para obtener los detalles de la orden
        const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/orders/${orderId}`);
        const { order, userData, items } = response.data;
        const { id, status_id, requires_electronic_billing } = order
        const { user_type, user_name, lastname, email, phone, address, neighborhood, city } = userData

        // Obtener costos de envío
        const fetchedShippingCosts = await getFetch('customer-types', '');
        const percentageShippingCost = getShippingCost(fetchedShippingCosts, user_type);

        const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
        const shippingCost = subtotal * percentageShippingCost
        const total = subtotal + shippingCost;

        const doc = new jsPDF();
        doc.setFontSize(10);
    
        // **Insertar el logo de la empresa**
        const logoUrl = '/images/1.png';
        doc.addImage(logoUrl, 'PNG', 10, 5, 50, 30);
    
        // **Información del remitente**
        const senderInfo = ['Don Kampo S.A.S', 'Nit 901.865.742', 'Chía - Cundinamarca', '3117366666'];
        const pageWidth = doc.internal.pageSize.width;
        const senderX = pageWidth - 50;
    
        doc.setFont('helvetica', 'bold');
        senderInfo.forEach((line, index) => {
            doc.text(line, senderX, 10 + (index * 5));
        });
    
        // **Título del documento y fecha**
        doc.setFontSize(14);
        doc.text("Detalles de la Orden", 10, 35);
    
        doc.setFont('helvetica', 'bold');
        doc.text("ID de la orden:", 10, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(`${id}`, 60, 50);

        const status = status_id === 1 
            ? 'Pendiente' : status_id === 2
                ? 'Enviado' : status_id === 3
                    ? 'Entregado' : 'Cancelado';
        doc.setFont('helvetica', 'bold');
        doc.text("Estado:", 10, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`${status}`, 60, 55);
    
        doc.setFont('helvetica', 'bold');
        doc.text("Cliente:", 10, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(`${user_name} ${lastname}`, 60, 60);
    
        doc.setFont('helvetica', 'bold');
        doc.text("Correo:", 10, 65);
        doc.setFont('helvetica', 'normal');
        doc.text(email, 60, 65);
    
        doc.setFont('helvetica', 'bold');
        doc.text("Teléfono:", 10, 70);
        doc.setFont('helvetica', 'normal');
        doc.text(phone, 60, 70);
    
        doc.setFont('helvetica', 'bold');
        doc.text("Dirección:", 10, 75);
        doc.setFont('helvetica', 'normal');
        doc.text(`${address}${neighborhood}, ${city}`, 60, 75);
    
        doc.setFont('helvetica', 'bold');
        doc.text("Factura Electrónica:", 10, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(`${requires_electronic_billing ? "Sí" : "No"}`, 60, 80);
    
        // **Configuración de la tabla con los productos**
        const tableColumns = [
            { header: 'Producto', dataKey: 'description' },
            { header: 'Precio Unitario', dataKey: 'unitPrice' },
            { header: 'Cantidad', dataKey: 'quantity' },
            { header: 'Subtotal', dataKey: 'subtotal' },
        ];
    
        const tableData = items.flatMap((item) => {
            const { price, product_name, quality, presentation, quantity } = item;
            const itemPrice = isString(price) ? parseInt(price) : price

            return {
                description: `${product_name} (${quality} - ${presentation})`,
                unitPrice: formatPrice(itemPrice),
                quantity: formatPrice(quantity),
                subtotal: formatPrice(itemPrice * quantity)
            };
        });
          
        // **Renderizar la tabla**
        doc.autoTable({
            columns: tableColumns,
            body: tableData,
            startY: 85, // Comienza justo después de la dirección
            styles: { fontSize: 10, halign: 'center' },
        });
    
        // **Calcular posición final para totales**
        const finalY = doc.lastAutoTable.finalY + 10;
    
        // **Agregar subtotales, envío y total al final**
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Valor envio: (${percentageShippingCost * 100}%): $${formatPrice(shippingCost)}`, 10, finalY + 5);
        doc.text(`Valor Productos: $${formatPrice(subtotal)}`, 10, finalY);
        doc.setFontSize(14);
        doc.text(`Total Pedido: $${formatPrice(total)}`, 10, finalY + 10);

        doc.setTextColor(255, 0, 0);
        doc.text(`Los pedidos pueden ser fluctuantes, por lo tanto pueden variar`, 10, finalY + 15);
    
        // Descargar el PDF
        doc.save(`Orden_${id}.pdf`);
    } catch (error) {
        console.error("Error al generar el PDF:", error);
    }
};

export default generateOrderPDF