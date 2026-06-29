package com.pethaven.main.controller;

import com.pethaven.main.model.nosql.Notification;
import com.pethaven.main.model.nosql.SupplyProduct;
import com.pethaven.main.model.sql.*;
import com.pethaven.main.repository.nosql.NotificationRepository;
import com.pethaven.main.repository.nosql.SupplyProductRepository;
import com.pethaven.main.repository.sql.*;
import com.pethaven.main.socket.SocketServerManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/supplies")
public class SupplyController {

    @Autowired
    private SupplyProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private SupplyOrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private SocketServerManager socketServerManager;

    // --- Product Operations ---
    @GetMapping("/products")
    public ResponseEntity<List<SupplyProduct>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProductById(@PathVariable String id) {
        Optional<SupplyProduct> prodOpt = productRepository.findById(id);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
        }
        return ResponseEntity.ok(prodOpt.get());
    }

    @PostMapping("/products")
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<SupplyProduct> createProduct(@RequestBody SupplyProduct product) {
        if (product.getId() == null || product.getId().isEmpty()) {
            product.setId("sp" + System.currentTimeMillis());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(productRepository.save(product));
    }

    // --- Cart Operations ---
    @GetMapping("/cart/{adopterId}")
    public ResponseEntity<Cart> getCart(@PathVariable String adopterId) {
        Optional<Cart> cartOpt = cartRepository.findById(adopterId);
        if (cartOpt.isEmpty()) {
            Cart cart = new Cart(adopterId, 0.0);
            return ResponseEntity.ok(cartRepository.save(cart));
        }
        return ResponseEntity.ok(cartOpt.get());
    }

    @PostMapping("/cart/{adopterId}/add")
    @Transactional
    public ResponseEntity<?> addToCart(
            @PathVariable String adopterId,
            @RequestBody Map<String, Object> request) {

        String productId = (String) request.get("productId");
        Integer quantity = (Integer) request.get("quantity");
        if (quantity == null) quantity = 1;

        Optional<SupplyProduct> prodOpt = productRepository.findById(productId);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
        }
        SupplyProduct prod = prodOpt.get();

        if (prod.getStock() < quantity) {
            return ResponseEntity.badRequest().body(Map.of("message", "Insufficient stock available"));
        }

        Cart cart = cartRepository.findById(adopterId).orElseGet(() -> {
            Cart c = new Cart(adopterId, 0.0);
            return cartRepository.save(c);
        });

        Optional<CartItem> existingItemOpt = cart.getProducts().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
        } else {
            CartItem item = new CartItem(cart, productId, prod.getProductName(), prod.getImage(), prod.getPrice(), quantity, prod.getShelterId(), prod.getShelterName());
            cart.getProducts().add(item);
            cartItemRepository.save(item);
        }

        recalculateCartTotal(cart);
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    @DeleteMapping("/cart/{adopterId}/remove/{productId}")
    @Transactional
    public ResponseEntity<?> removeFromCart(
            @PathVariable String adopterId,
            @PathVariable String productId) {

        Optional<Cart> cartOpt = cartRepository.findById(adopterId);
        if (cartOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Cart not found"));
        }
        Cart cart = cartOpt.get();

        boolean removed = cart.getProducts().removeIf(item -> {
            if (item.getProductId().equals(productId)) {
                cartItemRepository.delete(item);
                return true;
            }
            return false;
        });

        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Item not found in cart"));
        }

        recalculateCartTotal(cart);
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    @PutMapping("/cart/{adopterId}/update/{productId}")
    @Transactional
    public ResponseEntity<?> updateCartItem(
            @PathVariable String adopterId,
            @PathVariable String productId,
            @RequestBody Map<String, Integer> request) {

        Integer quantity = request.get("quantity");
        if (quantity == null || quantity <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid quantity"));
        }

        Optional<SupplyProduct> prodOpt = productRepository.findById(productId);
        if (prodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
        }
        if (prodOpt.get().getStock() < quantity) {
            return ResponseEntity.badRequest().body(Map.of("message", "Insufficient stock"));
        }

        Optional<Cart> cartOpt = cartRepository.findById(adopterId);
        if (cartOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Cart not found"));
        }
        Cart cart = cartOpt.get();

        Optional<CartItem> itemOpt = cart.getProducts().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();

        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Item not found in cart"));
        }

        CartItem item = itemOpt.get();
        item.setQuantity(quantity);
        cartItemRepository.save(item);

        recalculateCartTotal(cart);
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    @DeleteMapping("/cart/{adopterId}/clear")
    @Transactional
    public ResponseEntity<?> clearCart(@PathVariable String adopterId) {
        Optional<Cart> cartOpt = cartRepository.findById(adopterId);
        if (cartOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Cart not found"));
        }
        Cart cart = cartOpt.get();
        cartItemRepository.deleteAll(cart.getProducts());
        cart.getProducts().clear();
        cart.setTotalAmount(0.0);
        return ResponseEntity.ok(cartRepository.save(cart));
    }

    // --- Order Operations ---
    @PostMapping("/order")
    @Transactional
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> request) {
        String adopterId = (String) request.get("adopterId");
        String shelterId = (String) request.get("shelterId");
        String deliveryAddress = (String) request.get("deliveryAddress");
        Double totalAmount = ((Number) request.get("totalAmount")).doubleValue();

        Map<String, String> adopterDetailsMap = (Map<String, String>) request.get("adopterDetails");
        List<Map<String, Object>> orderedProductsMap = (List<Map<String, Object>>) request.get("orderedProducts");

        if (adopterId == null || shelterId == null || orderedProductsMap == null || orderedProductsMap.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required order fields"));
        }

        String orderId = "ORD-" + System.currentTimeMillis();
        String now = Instant.now().toString();

        SupplyOrder order = new SupplyOrder();
        order.setOrderId(orderId);
        order.setAdopterId(adopterId);
        order.setShelterId(shelterId);
        order.setDeliveryAddress(deliveryAddress);
        order.setTotalAmount(totalAmount);
        order.setOrderStatus("Order Placed");
        order.setPaymentStatus("Pending");
        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        if (adopterDetailsMap != null) {
            order.setAdopterName(adopterDetailsMap.get("fullName"));
            order.setAdopterPhone(adopterDetailsMap.get("phone"));
            order.setAdopterEmail(adopterDetailsMap.get("email"));
        }

        // Save order structure first to generate references
        SupplyOrder savedOrder = orderRepository.save(order);

        List<OrderItem> items = new ArrayList<>();
        for (Map<String, Object> prodMap : orderedProductsMap) {
            String productId = (String) prodMap.get("productId");
            String productName = (String) prodMap.get("productName");
            String image = (String) prodMap.get("image");
            double price = ((Number) prodMap.get("price")).doubleValue();
            int quantity = ((Number) prodMap.get("quantity")).intValue();

            // Decrement Stock
            Optional<SupplyProduct> prodOpt = productRepository.findById(productId);
            if (prodOpt.isPresent()) {
                SupplyProduct prod = prodOpt.get();
                prod.setStock(Math.max(0, prod.getStock() - quantity));
                productRepository.save(prod);
            }

            OrderItem item = new OrderItem(savedOrder, productId, productName, image, price, quantity, shelterId, (String) prodMap.get("shelterName"));
            items.add(item);
            orderItemRepository.save(item);
        }
        savedOrder.setOrderedProducts(items);
        orderRepository.save(savedOrder);

        // Clear Cart
        Optional<Cart> cartOpt = cartRepository.findById(adopterId);
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cartItemRepository.deleteAll(cart.getProducts());
            cart.getProducts().clear();
            cart.setTotalAmount(0.0);
            cartRepository.save(cart);
        }

        // Push Socket Notification to Shelter
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(shelterId);
        notification.setRecipientRole("shelter");
        notification.setType("payment");
        notification.setTitle("New Supply Order Received");
        notification.setMessage("Order " + orderId + " placed by " + order.getAdopterName());
        notification.setRead(false);
        notification.setCreatedAt(now);
        notification.setData(Map.of(
                "orderId", orderId,
                "amount", String.valueOf(totalAmount)
        ));
        socketServerManager.sendNotification(notification);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
    }

    @GetMapping("/orders/adopter/{adopterId}")
    public ResponseEntity<List<SupplyOrder>> getAdopterOrders(@PathVariable String adopterId) {
        return ResponseEntity.ok(orderRepository.findByAdopterId(adopterId));
    }

    @GetMapping("/orders/shelter/{shelterId}")
    public ResponseEntity<List<SupplyOrder>> getShelterOrders(@PathVariable String shelterId) {
        return ResponseEntity.ok(orderRepository.findByShelterId(shelterId));
    }

    @PutMapping("/orders/{orderId}/status")
    @PreAuthorize("hasRole('ROLE_SHELTER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing status value"));
        }

        Optional<SupplyOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }

        SupplyOrder order = orderOpt.get();
        order.setOrderStatus(status);
        if (status.equalsIgnoreCase("delivered")) {
            order.setPaymentStatus("Paid");
        }
        order.setUpdatedAt(Instant.now().toString());
        SupplyOrder saved = orderRepository.save(order);

        // Notify Adopter
        Notification notification = new Notification();
        notification.setId("notif" + System.currentTimeMillis());
        notification.setRecipientId(order.getAdopterId());
        notification.setRecipientRole("adopter");
        notification.setType("payment");
        notification.setTitle("Order Status Updated");
        notification.setMessage("Your supply order " + orderId + " status has been updated to: " + status);
        notification.setRead(false);
        notification.setCreatedAt(Instant.now().toString());
        notification.setData(Map.of(
                "orderId", orderId,
                "status", status
        ));
        socketServerManager.sendNotification(notification);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable String orderId) {
        Optional<SupplyOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Order not found"));
        }
        return ResponseEntity.ok(orderOpt.get());
    }

    private void recalculateCartTotal(Cart cart) {
        double total = cart.getProducts().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
        cart.setTotalAmount(total);
    }
}
