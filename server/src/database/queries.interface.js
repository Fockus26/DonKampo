export const queries = {
  users: {
    getUsers: "SELECT * FROM users",
    getUsersById: "SELECT * FROM users WHERE id = $1",
    getUserOrdersById: `
      SELECT o.id AS order_id, o.order_date, o.status_id, o.total
      FROM orders o
      WHERE o.customer_id = $1
    `,
    createUsers: `
      INSERT INTO users (user_name, lastname, email, phone, city, address, neighborhood, user_password , user_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `,
    updateUsers: `
      UPDATE users
      SET 
        user_name = $1, 
        lastname = $2, 
        email = $3, 
        phone = $4, 
        city = $5, 
        address = $6, 
        neighborhood = $7, 
        user_password = $8, 
        user_type = $9
      WHERE id = $10
    `,
    updateUserStatus: `
      UPDATE users
      SET status_id = $2
      WHERE id = $1;
    `,
    deleteUsers: "DELETE FROM users WHERE id = $1",
    getUserByEmail: 'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    updateUserResetToken: `
      UPDATE users 
      SET reset_password_token = $1, reset_password_expires = to_timestamp($2) 
      WHERE id = $3
    `,
    verifyUserResetCode: `
      SELECT id 
      FROM users 
      WHERE email = $1 
      AND reset_password_token = $2 
      AND reset_password_expires > to_timestamp($3)
    `,
    updateUserPassword: `
      UPDATE users 
      SET user_password = $1, reset_password_token = NULL, reset_password_expires = NULL 
      WHERE id = $2
    `,
  },
  customerTypes: {
    getAllCustomerTypes: `
    SELECT * FROM customer_types;
  `,
  updateAllShippingCosts: `
   UPDATE customer_types
    SET shipping_cost = CASE 
      WHEN type_name = 'Hogar' THEN $1::numeric
      WHEN type_name = 'Fruver' THEN $2::numeric
      WHEN type_name = 'Supermercado' THEN $3::numeric
      WHEN type_name = 'Restaurante' THEN $4::numeric
  END;
  `,
  }, 
  orders: {
    getOrders: `
    SELECT 
      o.id, 
      o.customer_id, 
      o.order_date, 
      o.status_id, 
      o.total, 
      o.requires_electronic_billing, 
      o.company_name, 
      o.nit,
      o.user_type
    FROM orders o
  `,
    getOrdersById: `
      SELECT 
        o.id, 
        o.customer_id, 
        o.order_date, 
        o.status_id, 
        o.total, 
        o.requires_electronic_billing, 
        o.company_name, 
        o.nit,
        u.user_name AS customer_name, 
        u.email AS customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.id = $1
    `,
    getOrderItemsByOrderId: `
      SELECT 
        oi.order_id, 
        oi.product_id, 
        oi.quantity, 
        oi.price,
        oi.variation_id,
        oi.quality,
        oi.presentation,
        oi.presentation_id,
        p.name AS product_name, 
        p.description AS product_description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1
    `,
    getOrderItemsByOrderIds: `
    SELECT 
        oi.order_id, 
        oi.product_id, 
        oi.quantity, 
        oi.price,
        oi.variation_id,
        oi.quality,
        oi.presentation,
        oi.presentation_id,
        p.name AS product_name, 
        p.description AS product_description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ANY($1)
    `,
    getShippingInfoByOrderId: `
      SELECT 
        si.order_id,
        si.shipping_method, 
        si.tracking_number, 
        si.estimated_delivery,
        si.actual_delivery, 
        si.shipping_status_id
      FROM shipping_info si
      WHERE si.order_id = $1
    `,
    getShippingInfoByOrderIds: `
      SELECT 
        si.order_id,
        si.shipping_method, 
        si.tracking_number, 
        si.estimated_delivery,
        si.actual_delivery, 
        si.shipping_status_id
      FROM shipping_info si
      WHERE si.order_id = ANY($1)
    `,
    createOrder: `
    INSERT INTO orders (
      customer_id, 
      order_date, 
      status_id, 
      total, 
      requires_electronic_billing, 
      company_name, 
      nit,
      user_type
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING id
  `,
    updateOrders: `
      UPDATE orders
      SET 
        customer_id = $1, 
        order_date = $2, 
        status_id = $3, 
        total = $4, 
        needs_electronic_invoice = $5, 
        company_name = $6, 
        nit = $7
      WHERE id = $8
    `,
    updateOrderStatus: `
      UPDATE orders
      SET status_id = $1
      WHERE id = $2
    `,
    deleteOrders: `
      DELETE FROM orders 
      WHERE id = $1
    `,
    createOrderItem: `
      INSERT INTO order_items (
        order_id, 
        product_id, 
        quantity, 
        price,
        variation_id,
        quality,
        presentation,
        presentation_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)

    `  
  },
  order_statuses: {
    getOrderStatuses: "SELECT * FROM order_statuses",
    getOrderStatusesById: "SELECT * FROM order_statuses WHERE id = $1",
    createOrderStatuses: `
      INSERT INTO order_statuses (status_name)
      VALUES ($1) RETURNING id
    `,
    updateOrderStatuses: `
      UPDATE order_statuses
      SET status_name = $1
      WHERE id = $2
    `,
    deleteOrderStatuses: "DELETE FROM order_statuses WHERE id = $1",
  },
  shipping_statuses: {
    getShippingStatuses: "SELECT * FROM shipping_statuses",
    getShippingStatusesById: "SELECT * FROM shipping_statuses WHERE id = $1",
    createShippingStatuses: `
      INSERT INTO shipping_statuses (status_name)
      VALUES ($1) RETURNING id
    `,
    updateShippingStatuses: `
      UPDATE shipping_statuses
      SET status_name = $1
      WHERE id = $2
    `,
    deleteShippingStatuses: "DELETE FROM shipping_statuses WHERE id = $1",
  },
  shipping_info: {
    getShippingInfo: "SELECT * FROM shipping_info",
    getShippingInfoById: "SELECT * FROM shipping_info WHERE id = $1",
    createShippingInfo: `
      INSERT INTO shipping_info (shipping_method, tracking_number, estimated_delivery, actual_delivery, shipping_status_id, order_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING shipping_info.id
    `,
    updateShippingInfo: `
      UPDATE shipping_info
      SET 
        shipping_method = $1, 
        tracking_number = $2, 
        estimated_delivery = $3, 
        actual_delivery = $4, 
        shipping_status_id = $5
      WHERE id = $6
    `,
    deleteShippingInfo: "DELETE FROM shipping_info WHERE id = $1",
  },
  products: {
    getProducts: `
      SELECT 
        p.product_id, 
        p.name, 
        p.description, 
        p.category, 
        p.photo_url,
        p.active,
        p.promocionar,  
        v.variation_id,
        v.quality,
        v.presentations,  -- IDs de presentaciones
        v.active AS variation_active
      FROM products p
      LEFT JOIN product_variations v ON p.product_id = v.product_id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $1;
    `,
    getProductById: `
      SELECT 
        p.product_id, 
        p.name, 
        p.description, 
        p.category, 
        p.photo_url,
        p.active,
        p.promocionar,
        v.variation_id,
        v.quality,
        v.presentations,  -- IDs de presentaciones
        v.active AS variation_active
      FROM products p
      LEFT JOIN product_variations v ON p.product_id = v.product_id
      WHERE p.product_id = $1;
    `,
    createProduct: `
      INSERT INTO products (name, description, category, photo_url, active, promocionar)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id;
    `,
    createProductVariation: `
      INSERT INTO product_variations (product_id, quality, presentations, active)
      VALUES ($1, $2, $3, $4) RETURNING variation_id;
    `,
    createProductPresentation: `
      INSERT INTO product_presentations 
      (variation_id, presentation, price_home, price_supermarket, price_restaurant, price_fruver, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING presentation_id;
    `,
    getProductPresentations: `
    SELECT 
      presentation_id,
      variation_id,
      presentation,
      price_home,
      price_supermarket,
      price_restaurant,
      price_fruver,
      stock
    FROM product_presentations
    WHERE variation_id = ANY($1);
  `,
    updateProduct: `
      UPDATE products
      SET 
        name = $1, 
        description = $2, 
        category = $3, 
        photo_url = COALESCE($4, photo_url),
        active = $5,
        promocionar = $6,  
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $7
      RETURNING product_id;
    `,
    updateProductVariation: `
    UPDATE product_variations
    SET 
      quality = $1,
      active = $2
    WHERE variation_id = $3;
    `,
    updateProductPresentation: `
      UPDATE product_presentations
      SET
        variation_id = $1,
        presentation = $2,
        stock = $3,
        price_home = $4,
        price_supermarket = $5,
        price_restaurant = $6,
        price_fruver = $7
      WHERE presentation_id = $8;
    `,
    getProductVariations: `
      SELECT 
        v.variation_id, 
        v.quality, 
        v.active,
        json_agg(
          json_build_object(
            'presentation_id', pp.presentation_id,
            'presentation', pp.presentation,
            'price_home', pp.price_home,
            'price_supermarket', pp.price_supermarket,
            'price_restaurant', pp.price_restaurant,
            'price_fruver', pp.price_fruver,
            'stock', pp.stock  -- <-- aquí agregas el stock
          )
        ) AS presentations
      FROM product_variations v
      LEFT JOIN product_presentations pp ON v.variation_id = pp.variation_id
      WHERE v.product_id = $1
      GROUP BY v.variation_id, v.quality, v.active;
  `,
    deleteProduct: `
      DELETE FROM products WHERE product_id = $1;
    `,
    deleteProductVariation: `
      DELETE FROM product_variations WHERE variation_id = $1;
    `,
    deletePresentation: `
    DELETE FROM product_presentations WHERE presentation_id = $1;
  `,
    deletePresentationsByVariation: `
      DELETE FROM product_presentations WHERE variation_id = $1;
    `

  },  
  advertisements: {
    getAll: `
      SELECT 
        a.advertisement_id, 
        a.title, 
        a.description, 
        a.category, 
        a.photo_url, 
        a.related_product_id,
        p.name AS related_product_name 
      FROM advertisements a
      LEFT JOIN products p ON a.related_product_id = p.product_id
    `,
    createAdvertisement: `
      INSERT INTO advertisements (title, description, category, photo_url, related_product_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING advertisement_id
    `,
    updateAdvertisement: `
      UPDATE advertisements 
      SET title = $1, description = $2, category = $3, photo_url = $4, related_product_id = $5
      WHERE advertisement_id = $6
    `,
    deleteAdvertisement: `
      DELETE FROM advertisements WHERE advertisement_id = $1
    `,
  },
  minimumOrders: {
    // Obtener todos los pedidos mínimos
    getAll: `
      SELECT 
        id, 
        customer_type, 
        minimum_order_amount, 
        created_at, 
        updated_at 
      FROM minimum_orders
      ORDER BY customer_type
    `,

    // Crear o actualizar un pedido mínimo
    createOrUpdate: `
      INSERT INTO minimum_orders (customer_type, minimum_order_amount)
      VALUES ($1, $2)
      ON CONFLICT (customer_type)
      DO UPDATE SET 
        minimum_order_amount = $2, 
        updated_at = NOW()
      RETURNING 
        id, 
        customer_type, 
        minimum_order_amount, 
        created_at, 
        updated_at
    `,

    // Eliminar un pedido mínimo
    delete: `
      DELETE FROM minimum_orders 
      WHERE id = $1
      RETURNING 
        id, 
        customer_type
    `,
  },
};
