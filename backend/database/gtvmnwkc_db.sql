-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 26, 2025 at 12:53 AM
-- Server version: 11.4.8-MariaDB-cll-lve
-- PHP Version: 8.3.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gtvmnwkc_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `customer_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`customer_data`)),
  `vehicle_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`vehicle_data`)),
  `service_type_id` int(11) NOT NULL,
  `booking_date` date NOT NULL,
  `booking_time` time NOT NULL,
  `status` enum('confirmed','in_progress','completed','cancelled','no_show') DEFAULT 'confirmed',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `phone`, `customer_data`, `vehicle_data`, `service_type_id`, `booking_date`, `booking_time`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(2, '0123456789', '{\"name\":\"Test Customer\",\"phone\":\"0123456789\",\"email\":\"test@example.com\",\"address\":\"Test Address\"}', '{\"plate_number\":\"TEST-123\",\"model\":\"SOBEN\",\"vin_number\":\"TEST123456789\",\"year\":2024}', 1, '2024-08-30', '10:00:00', 'in_progress', 'Test booking for API testing', '2025-08-29 11:24:11', '2025-08-29 11:38:58'),
(3, '0969686484', '{\"name\":\"Koemly\",\"phone\":\"0969686484\",\"email\":\"\",\"address\":\"\"}', '{\"plate_number\":\"SOBEN 2AD-4965\",\"model\":\"SOBEN\",\"vin_number\":\"\",\"year\":2025}', 7, '2025-08-30', '11:30:00', 'completed', 'ffgg', '2025-08-29 11:34:12', '2025-08-29 15:58:39'),
(4, '0123456789', '{\"name\":\"Sok Dara\",\"phone\":\"0123456789\",\"email\":\"sok.dara@example.com\",\"address\":\"456 Street 123, Phnom Penh\"}', '{\"plate_number\":\"SOBEN 2CD-7960\",\"model\":\"SOBEN\",\"vin_number\":\"VIN987654321\",\"year\":2024}', 1, '2024-08-30', '14:00:00', 'in_progress', 'Customer needs oil change and basic check up', '2025-08-29 16:03:23', '2025-08-29 16:04:17'),
(5, '', '{\"name\": \"Sok Channtrea\", \"phone\": \"012345678\"}', '{\"plate_number\": \"ABC-1234\", \"model\": \"Toyota Camry\"}', 1, '2025-09-01', '09:00:00', 'in_progress', 'Regular oil change', '2025-08-31 09:30:45', '2025-09-13 08:31:53'),
(6, '', '{\"name\": \"Yem Kunthea\", \"phone\": \"012345679\"}', '{\"plate_number\": \"XYZ-5678\", \"model\": \"Honda Civic\"}', 2, '2025-09-02', '10:00:00', 'in_progress', 'Brake service', '2025-08-31 09:30:45', '2025-09-13 10:41:15'),
(7, '', '{\"name\": \"Sok Chea\", \"phone\": \"012345680\"}', '{\"plate_number\": \"DEF-9012\", \"model\": \"Ford Ranger\"}', 3, '2025-09-03', '11:00:00', 'in_progress', 'Engine tune-up', '2025-08-31 09:30:45', '2025-09-13 16:33:23'),
(8, '096 852 2285', '{\"name\":\"fgg\",\"phone\":\"096 852 2285\",\"email\":\"\",\"address\":\"\"}', '{\"plate_number\":\"2AD-4965\",\"model\":\"SOBEN\",\"vin_number\":\"\",\"year\":2025}', 4, '2025-09-02', '11:00:00', 'in_progress', 'dg', '2025-09-01 14:02:39', '2025-09-01 17:14:43'),
(9, '0969686484', '{\"name\":\"fgg\",\"phone\":\"0969686484\",\"email\":\"\",\"address\":\"\"}', '{\"plate_number\":\"2AD-4968\",\"model\":\"SOBEN\",\"vin_number\":\"\",\"year\":2025}', 2, '2025-09-13', '11:00:00', 'in_progress', NULL, '2025-09-13 08:13:05', '2025-09-13 08:13:18'),
(10, 'e20180325', '{\"name\":\"Lyy- លី\",\"phone\":\"e20180325\",\"email\":\"\",\"address\":\"\"}', '{\"plate_number\":\"98778\",\"model\":\"KOUPREY\",\"vin_number\":\"\",\"year\":2025}', 13, '2025-09-13', '11:00:00', 'in_progress', NULL, '2025-09-13 08:46:16', '2025-09-13 08:46:24');

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL DEFAULT 'GTV Motors',
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `business_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`business_hours`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`id`, `company_name`, `address`, `phone`, `email`, `tax_id`, `logo_url`, `website`, `business_hours`, `created_at`, `updated_at`) VALUES
(1, 'GTV Motors Cambodia', 'Phnom Penh, Cambodia', '+855 12 345 678', 'service@gtvmotors.com', 'K001-901234567', NULL, NULL, NULL, '2025-08-31 09:04:59', '2025-08-31 09:09:27');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `customer_name` varchar(255) DEFAULT 'Unknown Customer',
  `customer_email` varchar(255) DEFAULT 'customer@example.com',
  `customer_address` text DEFAULT 'Address not provided'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `phone`, `address`, `email`, `created_at`, `updated_at`, `customer_name`, `customer_email`, `customer_address`) VALUES
(1, 'Poeng Lim', '883176894', 'Phnom Penh', 'poenglim@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 1', 'customer1@example.com', 'Address not provided'),
(2, 'Vith Boven', '99411455', 'Phnom Penh', 'vithboven@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 2', 'customer2@example.com', 'Address not provided'),
(3, 'San Channoeun', '10993436', 'Phnom Penh', 'sanchannoeun@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 3', 'customer3@example.com', 'Address not provided'),
(4, 'May Molin', '81658337', 'Phnom Penh', 'maymolin@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 4', 'customer4@example.com', 'Address not provided'),
(5, 'Seng Ann', '77211121', 'Phnom Penh', 'sengann@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 5', 'customer5@example.com', 'Address not provided'),
(6, 'Chann Mithona', '98363534', 'Kampong Cham', 'channmithona@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 6', 'customer6@example.com', 'Address not provided'),
(7, 'Lam Thearo', '99969596', 'Phnom Penh', 'lamthearo@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 7', 'customer7@example.com', 'Address not provided'),
(8, 'Mon Ponlork', '69613069', 'Siem Reap', 'monponlork@email.com', '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Customer 8', 'customer8@example.com', 'Address not provided'),
(9, 'Customer1', '010101010', 'Phnom Penh, Cambodia', 'cs1@gmail.com', '2025-08-26 09:11:48', '2025-08-30 17:13:47', 'Customer 9', 'customer9@example.com', 'Address not provided'),
(11, 'Lyy- លី', '0969686484', 'St2004', 'customer@example.com', '2025-08-27 15:45:13', '2025-09-01 16:30:12', 'Customer 11', 'customer11@example.com', 'Address not provided'),
(17, 'Sok Channtrea', '012345678', 'Phnom Penh, Cambodia', 'channtrea@example.com', '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'Sok Channtrea', 'channtrea@example.com', 'Phnom Penh, Cambodia'),
(18, 'Yem Kunthea', '012345679', 'Phnom Penh, Cambodia', 'kunthea@example.com', '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'Yem Kunthea', 'kunthea@example.com', 'Phnom Penh, Cambodia'),
(19, 'Sok Chea', '012345680', 'Phnom Penh, Cambodia', 'sokchea@example.com', '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'Sok Chea', 'sokchea@example.com', 'Phnom Penh, Cambodia'),
(20, 'Kim Sopheak', '012345681', 'Phnom Penh, Cambodia', 'sopheak@example.com', '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'Kim Sopheak', 'sopheak@example.com', 'Phnom Penh, Cambodia'),
(21, 'Ly Vuthy', '012345682', 'Phnom Penh, Cambodia', 'vuthy@example.com', '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'Ly Vuthy', 'vuthy@example.com', 'Phnom Penh, Cambodia'),
(42, 'koemly', 'e20180325', 'pp', 'admin@gmail.com', '2025-09-01 14:20:27', '2025-09-01 16:30:11', 'koemly', 'admin@gmail.com', 'pp'),
(43, 'hjj', '096 852 2285', 'pp', 'admin@gmail.com', '2025-09-01 14:47:33', '2025-09-01 16:30:11', 'hjj', 'admin@gmail.com', 'pp'),
(44, 'Ly Ly', '015526898', 'St2004', 'fr@gmail.com', '2025-09-01 17:43:55', '2025-09-01 17:43:55', 'Unknown Customer', 'customer@example.com', 'Address not provided'),
(45, 'Sok Sopheap', '085 523 656', 'Toul Kork, Phnom Penh', 'sopheap@gmail.com', '2025-09-03 13:42:23', '2025-09-03 13:42:23', 'Unknown Customer', 'customer@example.com', 'Address not provided'),
(46, 'Kim Thida', '087 57 65 78', 'Phnom Penh, Cambodia', 'thida123@gmail', '2025-09-03 14:09:08', '2025-09-03 14:09:08', 'Unknown Customer', 'customer@example.com', 'Address not provided'),
(47, 'Lyy- លី', '5566', 'St2004', NULL, '2025-09-06 09:55:33', '2025-09-06 09:55:33', 'Unknown Customer', 'customer@example.com', 'Address not provided'),
(48, 'Hon Sovanna', '0965869874', 'Kompong Speu, Cambodia', 'vanna15@gmail.com', '2025-09-07 15:19:32', '2025-09-07 15:19:32', 'Unknown Customer', 'customer@example.com', 'Address not provided'),
(49, 'Hon Sovanna', '095586247', 'Kompong Speu, Cambodia', 'vanna15@gmail.com', '2025-09-07 15:32:17', '2025-09-07 15:32:17', 'Unknown Customer', 'customer@example.com', 'Address not provided');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `unit_price` decimal(10,2) NOT NULL,
  `reorder_level` int(11) NOT NULL DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `item_name`, `category`, `quantity`, `unit_price`, `reorder_level`, `created_at`, `updated_at`) VALUES
(1, 'Engine Oil 5W-30', 'Lubricants', 50, 12.99, 10, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(2, 'Brake Pads Front', 'Brakes', 25, 45.99, 5, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(3, 'Air Filter', 'Filters', 30, 18.99, 8, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(4, 'Spark Plugs', 'Ignition', 40, 8.99, 15, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(5, 'Transmission Fluid', 'Lubricants', 20, 24.99, 5, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(6, 'Brake Fluid', 'Brakes', 35, 15.99, 10, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(7, 'Coolant', 'Cooling', 45, 22.99, 12, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(8, 'Battery 12V', 'Electrical', 15, 89.99, 3, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(9, 'Tire Pressure Sensor', 'Sensors', 20, 35.99, 5, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(10, 'Windshield Wiper', 'Exterior', 60, 12.99, 20, '2025-08-30 17:03:37', '2025-08-30 17:03:37'),
(11, 'Engine Oil 5W-30', 'Lubricants', 50, 12.99, 10, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(12, 'Brake Pads Front', 'Brakes', 25, 45.99, 5, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(13, 'Air Filter', 'Filters', 30, 18.99, 8, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(14, 'Spark Plugs', 'Ignition', 40, 8.99, 15, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(15, 'Transmission Fluid', 'Lubricants', 20, 24.99, 5, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(16, 'Brake Fluid', 'Brakes', 35, 15.99, 10, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(17, 'Coolant', 'Cooling', 45, 22.99, 12, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(18, 'Battery 12V', 'Electrical', 15, 89.99, 3, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(19, 'Tire Pressure Sensor', 'Sensors', 20, 35.99, 5, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(20, 'Windshield Wiper', 'Exterior', 60, 12.99, 20, '2025-08-30 17:05:49', '2025-08-30 17:05:49'),
(21, 'Engine Oil 5W-30', 'Lubricants', 50, 12.99, 10, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(22, 'Brake Pads Front', 'Brakes', 25, 45.99, 5, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(23, 'Air Filter', 'Filters', 30, 18.99, 8, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(24, 'Spark Plugs', 'Ignition', 40, 8.99, 15, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(25, 'Transmission Fluid', 'Lubricants', 20, 24.99, 5, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(26, 'Brake Fluid', 'Brakes', 35, 15.99, 10, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(27, 'Coolant', 'Cooling', 45, 22.99, 12, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(28, 'Battery 12V', 'Electrical', 15, 89.99, 3, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(29, 'Tire Pressure Sensor', 'Sensors', 20, 35.99, 5, '2025-08-30 17:09:18', '2025-08-30 17:09:18'),
(30, 'Windshield Wiper', 'Exterior', 60, 12.99, 20, '2025-08-30 17:09:18', '2025-08-30 17:09:18');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_categories`
--

CREATE TABLE `inventory_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_categories`
--

INSERT INTO `inventory_categories` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'Engine Oil', 'Various types of engine oils for different vehicle models', '2025-08-25 16:27:30'),
(2, 'Filters', 'Oil filters, air filters, fuel filters', '2025-08-25 16:27:30'),
(3, 'Brake Parts', 'Brake pads, brake discs, brake fluid', '2025-08-25 16:27:30'),
(4, 'Tools', 'Service tools and equipment', '2025-08-25 16:27:30'),
(5, 'Consumables', 'Fluids, cleaners, and other consumable items', '2025-08-25 16:27:30'),
(6, 'Engine Parts', 'Engine components and accessories', '2025-08-31 09:30:45'),
(7, 'Brake System', 'Brake pads, rotors, and related parts', '2025-08-31 09:30:45'),
(8, 'Oil & Fluids', 'Motor oil, brake fluid, and other fluids', '2025-08-31 09:30:45'),
(9, 'Filters', 'Air, oil, and fuel filters', '2025-08-31 09:30:45'),
(10, 'Tires', 'Various tire sizes and brands', '2025-08-31 09:30:45'),
(11, 'Engine Oil', 'Various types of engine oils for different vehicle models', '2025-09-01 16:30:12'),
(12, 'Filters', 'Oil filters, air filters, fuel filters', '2025-09-01 16:30:12'),
(13, 'Brake Parts', 'Brake pads, brake discs, brake fluid', '2025-09-01 16:30:12'),
(14, 'Tools', 'Service tools and equipment', '2025-09-01 16:30:12'),
(15, 'Consumables', 'Fluids, cleaners, and other consumable items', '2025-09-01 16:30:12');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `min_stock` int(11) NOT NULL DEFAULT 0,
  `max_stock` int(11) NOT NULL DEFAULT 100,
  `unit_price` decimal(10,2) NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `last_restocked` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_items`
--

INSERT INTO `inventory_items` (`id`, `category_id`, `name`, `sku`, `current_stock`, `min_stock`, `max_stock`, `unit_price`, `supplier`, `last_restocked`, `created_at`, `updated_at`) VALUES
(1, 1, 'Engine Oil 5W-30 (SOBEN)', 'OIL-5W30-SOB', 25, 10, 50, 15.00, 'GTV Parts Supply', '2025-07-01', '2025-08-25 16:27:30', '2025-08-25 16:27:30'),
(2, 1, 'Engine Oil 0W-20 (KAIN)', 'OIL-0W20-KAI', 8, 10, 40, 18.00, 'GTV Parts Supply', '2025-06-28', '2025-08-25 16:27:30', '2025-08-25 16:27:30'),
(3, 1, 'Engine Oil 5W-40 (KOUPREY)', 'OIL-5W40-KOU', 5, 8, 35, 16.50, 'GTV Parts Supply', '2025-07-02', '2025-08-25 16:27:30', '2025-08-31 09:30:45'),
(4, 2, 'Oil Filter (Universal)', 'FILT-OIL-UNI', 12, 6, 30, 8.50, 'Auto Parts Co.', '2025-07-05', '2025-08-25 16:27:30', '2025-08-31 09:30:45'),
(5, 2, 'Air Filter (SOBEN)', 'FILT-AIR-SOB', 18, 5, 20, 12.00, 'Auto Parts Co.', '2025-08-28', '2025-08-25 16:27:30', '2025-08-31 09:30:45'),
(6, 2, 'Air Filter (KAIN)', 'FILT-AIR-KAI', 6, 5, 20, 14.00, 'Auto Parts Co.', '2025-06-25', '2025-08-25 16:27:30', '2025-09-07 15:32:19'),
(7, 3, 'Brake Pads (Front)', 'BRAKE-PAD-F', 13, 4, 16, 45.00, 'Brake Systems Ltd.', '2025-08-28', '2025-08-25 16:27:30', '2025-09-07 15:19:35'),
(8, 3, 'Brake Pads (Rear)', 'BRAKE-PAD-R', 5, 4, 16, 40.00, 'Brake Systems Ltd.', '2025-06-18', '2025-08-25 16:27:30', '2025-09-03 13:13:33'),
(9, 3, 'Brake Fluid DOT 4', 'BRAKE-FLUID', 12, 6, 24, 8.00, 'Chemical Supply Co.', '2025-07-01', '2025-08-25 16:27:30', '2025-08-25 16:27:30'),
(10, 5, 'Coolant Fluid', 'COOLANT-STD', 11, 8, 25, 6.50, 'Chemical Supply Co.', '2025-07-03', '2025-08-25 16:27:30', '2025-09-01 17:53:04'),
(11, 5, 'Engine Cleaner', 'CLEAN-ENG', 8, 5, 20, 4.50, 'Chemical Supply Co.', '2025-06-30', '2025-08-25 16:27:30', '2025-08-25 16:27:30'),
(12, 1, 'Oil Change System', 'SKU1259J', 18, 5, 50, 50.00, 'GTV Supplier', NULL, '2025-08-28 14:29:50', '2025-09-03 14:09:14'),
(13, 1, 'Spark Plugs Set', 'SP-001', 85, 20, 100, 25.00, 'Auto Parts Co.', '2025-09-03', '2025-08-31 09:30:45', '2025-09-03 14:24:20'),
(14, 2, 'Brake Pads Front', 'BP-F001', 8, 15, 50, 45.00, 'Brake Systems Ltd.', NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(15, 2, 'Brake Pads Rear', 'BP-R001', 32, 15, 50, 40.00, 'Brake Systems Ltd.', '2025-09-02', '2025-08-31 09:30:45', '2025-09-01 17:13:39'),
(16, 3, 'Motor Oil 5W-30', 'MO-001', 11, 25, 200, 15.00, 'Oil Suppliers Inc.', NULL, '2025-08-31 09:30:45', '2025-09-01 17:53:04'),
(17, 4, 'Oil Filter', 'OF-001', 18, 30, 150, 8.00, 'Filter World', NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(18, 5, 'Tire 205/55R16', 'T-001', 6, 10, 40, 120.00, 'Tire Center', NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(19, 11, 'Oil Machine', 'SKU1259JMR', 5, 1, 50, 20.00, 'GTV Supplier', NULL, '2025-09-01 17:14:26', '2025-09-01 17:14:26');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `movement_type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `movement_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `staff_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `inventory_id`, `movement_type`, `quantity`, `unit_price`, `movement_date`, `staff_id`, `notes`) VALUES
(1, 1, 'OUT', 5, 12.99, '2025-08-30 17:03:37', 1, 'Service job #1234'),
(2, 2, 'OUT', 2, 45.99, '2025-08-30 17:03:37', 1, 'Brake replacement'),
(3, 3, 'OUT', 3, 18.99, '2025-08-30 17:03:37', 2, 'Regular maintenance'),
(4, 1, 'IN', 20, 11.99, '2025-08-30 17:03:37', 3, 'Restock order'),
(5, 4, 'OUT', 8, 8.99, '2025-08-30 17:03:37', 1, 'Tune-up service'),
(6, 5, 'OUT', 2, 24.99, '2025-08-30 17:03:37', 2, 'Transmission service'),
(7, 6, 'OUT', 1, 15.99, '2025-08-30 17:03:37', 1, 'Brake system flush'),
(8, 7, 'OUT', 4, 22.99, '2025-08-30 17:03:37', 2, 'Cooling system service'),
(9, 8, 'OUT', 1, 89.99, '2025-08-30 17:03:37', 1, 'Battery replacement'),
(10, 9, 'OUT', 2, 35.99, '2025-08-30 17:03:37', 2, 'Sensor replacement'),
(11, 1, 'OUT', 5, 12.99, '2025-08-30 17:05:49', 1, 'Service job #1234'),
(12, 2, 'OUT', 2, 45.99, '2025-08-30 17:05:49', 1, 'Brake replacement'),
(13, 3, 'OUT', 3, 18.99, '2025-08-30 17:05:49', 2, 'Regular maintenance'),
(14, 1, 'IN', 20, 11.99, '2025-08-30 17:05:49', 3, 'Restock order'),
(15, 4, 'OUT', 8, 8.99, '2025-08-30 17:05:49', 1, 'Tune-up service'),
(16, 5, 'OUT', 2, 24.99, '2025-08-30 17:05:49', 2, 'Transmission service'),
(17, 6, 'OUT', 1, 15.99, '2025-08-30 17:05:49', 1, 'Brake system flush'),
(18, 7, 'OUT', 4, 22.99, '2025-08-30 17:05:49', 2, 'Cooling system service'),
(19, 8, 'OUT', 1, 89.99, '2025-08-30 17:05:49', 1, 'Battery replacement'),
(20, 9, 'OUT', 2, 35.99, '2025-08-30 17:05:49', 2, 'Sensor replacement'),
(21, 1, 'OUT', 5, 12.99, '2025-08-30 17:09:18', 1, 'Service job #1234'),
(22, 2, 'OUT', 2, 45.99, '2025-08-30 17:09:18', 1, 'Brake replacement'),
(23, 3, 'OUT', 3, 18.99, '2025-08-30 17:09:18', 2, 'Regular maintenance'),
(24, 1, 'IN', 20, 11.99, '2025-08-30 17:09:18', 3, 'Restock order'),
(25, 4, 'OUT', 8, 8.99, '2025-08-30 17:09:18', 1, 'Tune-up service'),
(26, 5, 'OUT', 2, 24.99, '2025-08-30 17:09:18', 2, 'Transmission service'),
(27, 6, 'OUT', 1, 15.99, '2025-08-30 17:09:18', 1, 'Brake system flush'),
(28, 7, 'OUT', 4, 22.99, '2025-08-30 17:09:18', 2, 'Cooling system service'),
(29, 8, 'OUT', 1, 89.99, '2025-08-30 17:09:18', 1, 'Battery replacement'),
(30, 9, 'OUT', 2, 35.99, '2025-08-30 17:09:18', 2, 'Sensor replacement');

--
-- Triggers `inventory_movements`
--
DELIMITER $$
CREATE TRIGGER `update_inventory_stock` AFTER INSERT ON `inventory_movements` FOR EACH ROW BEGIN
  IF NEW.movement_type = 'IN' THEN
    UPDATE inventory SET quantity = quantity + NEW.quantity WHERE id = NEW.inventory_id;
  ELSEIF NEW.movement_type = 'OUT' THEN
    UPDATE inventory SET quantity = GREATEST(0, quantity - NEW.quantity) WHERE id = NEW.inventory_id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_status`
--

CREATE TABLE `inventory_status` (
  `id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `current_stock` int(11) DEFAULT NULL,
  `min_stock` int(11) DEFAULT NULL,
  `max_stock` int(11) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `last_restocked` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `category_name` varchar(100) DEFAULT NULL,
  `stock_status` varchar(12) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `email`, `ip_address`, `success`, `attempted_at`, `user_agent`) VALUES
(1, 'gtv@gmail.com', '::1', 1, '2025-08-26 10:32:48', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(2, 'gtv@gmail.com', '::1', 1, '2025-08-26 11:19:56', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(3, 'gtv@gmail.com', '::1', 1, '2025-08-26 15:32:01', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'),
(4, 'gtv@gmail.com', '::1', 0, '2025-08-26 17:04:51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(5, 'gtv@gmail.com', '::1', 1, '2025-08-26 17:05:07', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(6, 'gtv@gmail.com', '::1', 1, '2025-08-27 09:44:17', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(7, 'gtv@gmail.com', '::1', 1, '2025-08-27 14:41:07', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(8, 'gtv@gmail.com', '::1', 1, '2025-08-28 14:03:34', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(9, 'gtv@gmail.com', '::1', 1, '2025-08-29 10:32:43', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(10, 'gtv@gmail.com', '::1', 1, '2025-08-30 16:34:16', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(11, 'gtv@gmail.com', '::1', 1, '2025-08-31 08:25:57', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(12, 'gtv@gmail.com', '::1', 1, '2025-08-31 09:55:32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(13, 'new@gmail.com', '::1', 1, '2025-08-31 10:03:10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(14, 'gtv@gmail.com', '::1', 1, '2025-09-01 13:35:59', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(15, 'gtv@gmail.com', '::1', 1, '2025-09-01 18:21:11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(16, 'gtv@gmail.com', '::1', 1, '2025-09-03 13:38:54', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(17, 'gtv@gmail.com', '::1', 1, '2025-09-13 07:31:04', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(18, 'gtv@gmail.com', '::1', 0, '2025-09-15 14:18:25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(19, 'gtv@gmail.com', '::1', 0, '2025-09-15 14:18:51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(20, 'ahpea88@gmail.com', '::1', 1, '2025-09-15 14:19:40', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(0, 'admin@rhtower.com', '175.100.10.154', 0, '2025-09-24 19:02:13', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(0, 'admin@rhtower.com', '175.100.10.154', 0, '2025-09-24 19:02:33', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(0, 'admin@rhtower.com', '175.100.10.154', 0, '2025-09-24 19:03:01', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(0, '0', '175.100.10.154', 1, '2025-09-24 19:03:57', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(0, '8', '103.206.70.79', 1, '2025-09-26 04:17:41', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notification_settings`
--

INSERT INTO `notification_settings` (`id`, `setting_key`, `setting_value`, `description`, `created_at`, `updated_at`) VALUES
(1, 'email_notifications', 1, 'Enable email notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(2, 'sms_notifications', 1, 'Enable SMS notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(3, 'service_reminders', 1, 'Enable service reminder notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(4, 'low_stock_alerts', 1, 'Enable low stock alert notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(5, 'warranty_expiry', 1, 'Enable warranty expiry notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(6, 'daily_reports', 0, 'Enable daily summary reports', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(7, 'booking_confirmation', 1, 'Enable booking confirmation notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(8, 'payment_reminders', 1, 'Enable payment reminder notifications', '2025-08-31 09:04:59', '2025-08-31 09:04:59');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_type` enum('booking','walking') DEFAULT 'walking',
  `booking_id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) NOT NULL,
  `service_type_id` int(11) NOT NULL,
  `service_date` date NOT NULL,
  `current_km` int(11) DEFAULT NULL,
  `next_service_km` int(11) DEFAULT NULL,
  `next_service_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','aba','card','bank_transfer') NOT NULL,
  `payment_status` enum('pending','paid','cancelled') DEFAULT 'pending',
  `service_status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `service_detail` text DEFAULT NULL,
  `technician_id` int(11) DEFAULT NULL,
  `sales_rep_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `service_cost` decimal(10,2) DEFAULT 100.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `invoice_number`, `customer_id`, `customer_type`, `booking_id`, `vehicle_id`, `service_type_id`, `service_date`, `current_km`, `next_service_km`, `next_service_date`, `total_amount`, `payment_method`, `payment_status`, `service_status`, `notes`, `service_detail`, `technician_id`, `sales_rep_id`, `created_at`, `updated_at`, `service_cost`) VALUES
(1, 'SR25-0207', 1, 'walking', NULL, 1, 1, '2025-07-10', 15000, 20000, '2025-10-10', 450.00, 'aba', 'paid', 'completed', 'Oil change service completed', NULL, 3, 2, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(2, 'SR25-0206', 2, 'walking', NULL, 2, 2, '2025-06-17', 8000, 15000, '2025-09-17', 95.00, 'cash', 'paid', 'completed', 'Check sensor and tire pressure', NULL, 4, 1, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(3, 'SR25-0205', 3, 'walking', NULL, 3, 3, '2025-06-28', 25000, 30000, '2025-09-28', 280.00, 'aba', 'paid', 'completed', 'Comprehensive maintenance service', NULL, 5, 2, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(4, 'SR25-0204', 4, 'walking', NULL, 4, 1, '2025-07-07', 5000, 10000, '2025-10-07', 450.00, 'aba', 'paid', 'completed', 'Oil change and basic check', NULL, 6, 1, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(5, 'SR25-0203', 5, 'walking', NULL, 5, 8, '2025-06-09', 18000, 23000, '2025-09-09', 180.00, 'aba', 'paid', 'completed', 'Brake system repair', NULL, 4, 2, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(6, 'SR25-0202', 6, 'walking', NULL, 6, 7, '2025-07-07', 44000, 49000, '2025-10-07', 250.00, 'aba', 'paid', 'completed', 'Engine diagnostic and repair', NULL, 5, 1, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(7, 'SR25-0201', 7, 'walking', NULL, 7, 1, '2025-06-10', 300, 5000, '2025-09-10', 450.00, 'cash', 'paid', 'completed', 'First service - oil change', NULL, 6, 2, '2025-08-25 16:27:30', '2025-08-25 16:27:30', 100.00),
(13, 'INV-001', 1, 'walking', NULL, 1, 1, '2025-08-31', 50000, NULL, NULL, 25.00, 'cash', 'paid', 'completed', 'Regular maintenance', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(14, 'INV-002', 2, 'walking', NULL, 2, 2, '2025-08-31', 45000, NULL, NULL, 150.00, 'aba', 'paid', 'completed', 'Brake service completed', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(15, 'INV-003', 3, 'walking', NULL, 3, 3, '2025-08-31', 30000, NULL, NULL, 200.00, 'card', 'paid', 'completed', 'Engine tune-up', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(16, 'INV-004', 4, 'walking', NULL, 4, 4, '2025-08-30', 60000, NULL, NULL, 300.00, 'bank_transfer', 'paid', 'completed', 'AC repair', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(17, 'INV-005', 5, 'walking', NULL, 5, 5, '2025-08-29', 25000, NULL, NULL, 40.00, 'cash', 'paid', 'completed', 'Tire rotation', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(18, 'INV-006', 1, 'walking', NULL, 1, 6, '2025-08-28', 52000, NULL, NULL, 120.00, 'aba', 'paid', 'completed', 'Battery replacement', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(19, 'INV-007', 2, 'walking', NULL, 2, 1, '2025-08-27', 47000, NULL, NULL, 25.00, 'cash', 'paid', 'completed', 'Oil change', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(20, 'INV-008', 3, 'walking', NULL, 3, 2, '2025-08-26', 32000, NULL, NULL, 150.00, 'card', 'pending', 'pending', 'Brake service scheduled', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(21, 'INV-009', 4, 'walking', NULL, 4, 3, '2025-08-25', 62000, NULL, NULL, 200.00, 'bank_transfer', 'pending', 'in_progress', 'Engine work in progress', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(22, 'INV-010', 5, 'walking', NULL, 5, 4, '2025-08-24', 27000, NULL, NULL, 300.00, 'aba', 'pending', 'pending', 'AC service scheduled', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(23, 'INV-011', 1, 'walking', NULL, 1, 1, '2025-08-21', 53000, NULL, NULL, 25.00, 'cash', 'pending', 'pending', 'Overdue oil change', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(24, 'INV-012', 2, 'walking', NULL, 2, 2, '2025-08-16', 48000, NULL, NULL, 150.00, 'aba', 'pending', 'pending', 'Overdue brake service', NULL, NULL, NULL, '2025-08-31 09:30:45', '2025-08-31 09:30:45', 100.00),
(27, 'INV-20250902-3334', 44, 'walking', NULL, 46, 14, '2025-09-01', 14998, 25000, '2025-12-31', 21.50, 'aba', 'pending', 'pending', NULL, NULL, 4, 1, '2025-09-01 17:53:00', '2025-09-01 17:53:00', 100.00),
(28, 'INV-20250902-6349', 42, 'walking', NULL, 47, 14, '2025-09-01', 158000, 50000, '2025-11-30', 100.00, 'aba', 'pending', 'pending', NULL, NULL, 7, 8, '2025-09-01 18:03:11', '2025-09-01 18:03:11', 100.00),
(29, 'INV-20250903-4247', 11, 'walking', NULL, 11, 14, '2025-09-03', 18000, 25000, '2025-10-03', 90.00, 'aba', 'pending', 'pending', NULL, NULL, 4, 3, '2025-09-03 13:13:32', '2025-09-03 13:13:32', 100.00),
(30, 'INV-20250903-7277', 46, 'walking', NULL, 48, 14, '2025-09-03', 10000, 15000, '2025-11-03', 200.00, 'aba', 'pending', 'pending', '-Add more fix to the part as mention above', NULL, 4, 8, '2025-09-03 14:09:11', '2025-09-03 14:09:11', 100.00),
(31, 'INV-20250906-2478', 47, 'walking', NULL, 49, 14, '2025-09-06', NULL, NULL, NULL, 50.00, 'cash', 'pending', 'pending', NULL, '45566', NULL, NULL, '2025-09-06 09:55:34', '2025-09-06 09:55:34', 100.00),
(32, 'INV-20250906-7760', 11, 'walking', NULL, 50, 1, '2025-09-06', NULL, NULL, NULL, 20.00, 'cash', 'pending', 'pending', NULL, 'rtty', NULL, NULL, '2025-09-06 09:59:44', '2025-09-06 09:59:44', 100.00),
(33, 'INV-20250906-1495', 43, 'walking', NULL, 51, 1, '2025-09-06', NULL, NULL, NULL, 20.00, 'cash', 'pending', 'pending', NULL, 'ggh', NULL, NULL, '2025-09-06 10:00:58', '2025-09-06 10:00:58', 100.00),
(34, 'INV-20250907-1175', 48, 'walking', NULL, 52, 1, '2025-09-07', 15800, 25000, '2025-11-07', 65.00, 'aba', 'paid', 'completed', 'Change as the above for customer', '-Check oil and Change as customer wants', 4, 2, '2025-09-07 15:19:33', '2025-09-09 14:41:29', 100.00),
(35, 'INV-20250907-9420', 49, 'walking', NULL, 53, 1, '2025-09-07', 16000, 25000, '2025-10-21', 34.00, 'aba', 'paid', 'completed', 'Add like it the above', 'Change Oil and Add Oil', 7, 8, '2025-09-07 15:32:18', '2025-09-07 15:53:30', 100.00);

-- --------------------------------------------------------

--
-- Table structure for table `service_alerts`
--

CREATE TABLE `service_alerts` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `alert_type` enum('service_due','warranty_expiring','follow_up') NOT NULL,
  `alert_date` date NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','sent','completed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_alerts`
--

INSERT INTO `service_alerts` (`id`, `customer_id`, `vehicle_id`, `alert_type`, `alert_date`, `message`, `status`, `created_at`, `updated_at`) VALUES
(18, 1, 1, 'service_due', '2025-10-10', 'Service due at 20000 km or by October 10, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(19, 2, 2, 'service_due', '2025-09-17', 'Service due at 15000 km or by September 17, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(20, 3, 3, 'service_due', '2025-09-28', 'Service due at 30000 km or by September 28, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(21, 4, 4, 'service_due', '2025-10-07', 'Service due at 10000 km or by October 07, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(22, 5, 5, 'service_due', '2025-09-09', 'Service due at 23000 km or by September 09, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(23, 6, 6, 'service_due', '2025-10-07', 'Service due at 49000 km or by October 07, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(24, 7, 7, 'service_due', '2025-09-10', 'Service due at 5000 km or by September 10, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(25, 8, 8, 'warranty_expiring', '2025-09-25', 'Warranty expires on September 25, 2025', 'pending', '2025-08-29 17:10:53', '2025-08-29 17:10:53'),
(26, 1, 1, 'service_due', '2025-09-03', 'Oil change due for Toyota Camry', 'pending', '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(27, 2, 2, 'service_due', '2025-09-05', 'Brake inspection due for Honda Civic', 'pending', '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(28, 3, 3, 'warranty_expiring', '2025-09-10', 'Warranty expiring soon for Ford Ranger', 'pending', '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(29, 4, 4, 'follow_up', '2025-09-07', 'Follow-up service reminder for Nissan X-Trail', 'pending', '2025-08-31 09:30:45', '2025-08-31 09:30:45'),
(30, 5, 5, 'service_due', '2025-09-02', 'Tire rotation due for Mazda CX-5', 'pending', '2025-08-31 09:30:45', '2025-08-31 09:30:45');

-- --------------------------------------------------------

--
-- Table structure for table `service_items`
--

CREATE TABLE `service_items` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `item_type` enum('service','part','labor') DEFAULT 'service',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_items`
--

INSERT INTO `service_items` (`id`, `service_id`, `description`, `quantity`, `unit_price`, `total_price`, `item_type`, `created_at`) VALUES
(1, 1, 'Engine Oil Change - SOBEN', 1, 400.00, 400.00, 'service', '2025-08-25 16:27:30'),
(2, 1, 'Oil Filter Replacement', 1, 50.00, 50.00, 'part', '2025-08-25 16:27:30'),
(3, 2, 'Vehicle Check Up', 1, 95.00, 95.00, 'service', '2025-08-25 16:27:30'),
(4, 3, 'Comprehensive Maintenance', 1, 250.00, 250.00, 'service', '2025-08-25 16:27:30'),
(5, 3, 'Parts and Materials', 1, 30.00, 30.00, 'part', '2025-08-25 16:27:30'),
(6, 4, 'Oil Change Service', 1, 400.00, 400.00, 'service', '2025-08-25 16:27:30'),
(7, 4, 'Basic Inspection', 1, 50.00, 50.00, 'service', '2025-08-25 16:27:30'),
(8, 5, 'Brake Pad Replacement', 1, 120.00, 120.00, 'part', '2025-08-25 16:27:30'),
(9, 5, 'Labor - Brake Service', 1, 60.00, 60.00, 'labor', '2025-08-25 16:27:30'),
(10, 6, 'Engine Repair Service', 1, 200.00, 200.00, 'service', '2025-08-25 16:27:30'),
(11, 6, 'Engine Parts', 1, 50.00, 50.00, 'part', '2025-08-25 16:27:30'),
(12, 7, 'First Oil Change', 1, 450.00, 450.00, 'service', '2025-08-25 16:27:30'),
(19, 27, 'Coolant Fluid', 1, 6.50, 6.50, 'part', '2025-09-01 17:53:03'),
(20, 27, 'Motor Oil 5W-30', 1, 15.00, 15.00, 'part', '2025-09-01 17:53:03'),
(21, 28, 'Check Up', 1, 50.00, 50.00, 'service', '2025-09-01 18:03:12'),
(22, 28, 'Oil Change System', 1, 50.00, 50.00, 'part', '2025-09-01 18:03:12'),
(23, 29, 'Check Up', 1, 50.00, 50.00, 'service', '2025-09-03 13:13:33'),
(24, 29, 'Brake Pads (Rear)', 1, 40.00, 40.00, 'part', '2025-09-03 13:13:33'),
(25, 30, 'Repairing', 1, 150.00, 150.00, 'service', '2025-09-03 14:09:12'),
(26, 30, 'Oil Change System', 1, 50.00, 50.00, 'part', '2025-09-03 14:09:12'),
(27, 31, 'Check Up', 1, 50.00, 50.00, 'service', '2025-09-06 09:55:35'),
(28, 32, 'Change Oil', 1, 20.00, 20.00, 'service', '2025-09-06 09:59:45'),
(29, 33, 'Change Oil', 1, 20.00, 20.00, 'service', '2025-09-06 10:00:58'),
(30, 34, 'Change Oil', 1, 20.00, 20.00, 'service', '2025-09-07 15:19:34'),
(31, 34, 'Brake Pads (Front)', 1, 45.00, 45.00, 'part', '2025-09-07 15:19:34'),
(32, 35, 'Change Oil', 1, 20.00, 20.00, 'service', '2025-09-07 15:32:19'),
(33, 35, 'Air Filter (KAIN)', 1, 14.00, 14.00, 'part', '2025-09-07 15:32:19');

-- --------------------------------------------------------

--
-- Table structure for table `service_types`
--

CREATE TABLE `service_types` (
  `id` int(11) NOT NULL,
  `service_type_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category` varchar(50) DEFAULT 'General',
  `base_price` decimal(10,2) DEFAULT 0.00,
  `estimated_duration` int(11) DEFAULT 60 COMMENT 'Duration in minutes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_types`
--

INSERT INTO `service_types` (`id`, `service_type_name`, `description`, `created_at`, `category`, `base_price`, `estimated_duration`) VALUES
(1, 'Oil Change', 'Regular oil change service', '2025-08-30 17:19:47', 'General', 0.00, 60),
(2, 'Brake Service', 'Brake system maintenance and repair', '2025-08-30 17:19:47', 'General', 0.00, 60),
(3, 'Electrical', 'Electrical system diagnosis and repair', '2025-08-30 17:19:47', 'General', 0.00, 60),
(4, 'Engine Service', 'Engine maintenance and repair', '2025-08-30 17:19:47', 'General', 0.00, 60),
(5, 'Transmission', 'Transmission service and repair', '2025-08-30 17:19:47', 'General', 0.00, 60),
(6, 'Tire Service', 'Tire rotation and replacement', '2025-08-30 17:19:47', 'General', 0.00, 60),
(7, 'Air Conditioning', 'AC system service and repair', '2025-08-30 17:19:47', 'General', 0.00, 60),
(8, 'Suspension', 'Suspension system maintenance', '2025-08-30 17:19:47', 'General', 0.00, 60),
(9, 'Exhaust', 'Exhaust system repair', '2025-08-30 17:19:47', 'General', 0.00, 60),
(10, 'General Maintenance', 'General vehicle maintenance', '2025-08-30 17:19:47', 'General', 0.00, 60),
(11, 'Engine Tune-up', 'Spark plug replacement and engine optimization', '2025-08-31 09:32:39', 'General', 0.00, 60),
(12, 'Tire Rotation', 'Tire rotation and balance', '2025-08-31 09:32:39', 'General', 0.00, 60),
(13, 'Battery Replacement', 'Battery replacement and testing', '2025-08-31 09:32:39', 'General', 0.00, 60),
(14, 'Basic Check Up', 'Basic vehicle check up and inspection service', '2025-09-01 14:18:35', 'General', 0.00, 60),
(15, 'Preventive Maintenance', 'Scheduled preventive maintenance service', '2025-09-01 14:21:46', 'General', 0.00, 60);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','service_advisor','technician','manager') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `staff_name` varchar(255) DEFAULT 'Staff Member',
  `password_hash` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `department` varchar(100) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `emergency_contact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`emergency_contact`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `name`, `role`, `phone`, `email`, `active`, `created_at`, `updated_at`, `staff_name`, `password_hash`, `last_login`, `permissions`, `department`, `hire_date`, `salary`, `emergency_contact`) VALUES
(1, 'Sok Channtrea', 'manager', '012345678', 'channtrea@gtvmotors.com', 1, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Staff Member 1', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'Yem Kunthea', 'service_advisor', '012345679', 'kunthea@gtvmotors.com', 1, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Staff Member 2', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Tey Sreylin', 'service_advisor', '012345680', 'sreylin@gtvmotors.com', 1, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Staff Member 3', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Sok Chea', 'technician', '012345681', 'sokchea@gtvmotors.com', 1, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Staff Member 4', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'Daroeun', 'technician', '012345682', 'daroeun@gtvmotors.com', 1, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Staff Member 5', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'Ly Ly', 'technician', '012345683', 'lyly@gtvmotors.com', 0, '2025-08-25 16:27:30', '2025-08-31 09:20:14', 'Staff Member 6', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'Sou Seavlin', 'technician', '012345684', 'seavlin@gtvmotors.com', 1, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'Staff Member 7', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Soy Ben LyLy', 'manager', '020202020', 'lyly@GTV.com', 1, '2025-08-31 09:09:23', '2025-09-01 16:30:11', 'Soy Ben LyLy', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `movement_type` enum('in','out','adjustment') NOT NULL,
  `quantity` int(11) NOT NULL,
  `reference_type` enum('purchase','service','adjustment','return') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `item_id`, `movement_type`, `quantity`, `reference_type`, `reference_id`, `notes`, `created_at`) VALUES
(1, 12, 'in', 20, 'purchase', NULL, 'Initial stock from item creation', '2025-08-28 14:29:51'),
(2, 7, 'in', 14, 'purchase', NULL, 'jygy', '2025-08-28 14:44:02'),
(3, 5, 'in', 13, 'purchase', NULL, 'jhj', '2025-08-28 14:44:27'),
(4, 1, 'in', 50, 'purchase', 1, 'Bulk purchase of spark plugs', '2025-08-31 09:30:45'),
(5, 2, 'in', 30, 'purchase', 2, 'Brake pads restock', '2025-08-31 09:30:45'),
(6, 3, 'in', 30, 'purchase', 3, 'Rear brake pads restock', '2025-08-31 09:30:45'),
(7, 4, 'in', 100, 'purchase', 4, 'Motor oil restock', '2025-08-31 09:30:45'),
(8, 5, 'in', 75, 'purchase', 5, 'Oil filters restock', '2025-08-31 09:30:45'),
(9, 6, 'in', 20, 'purchase', 6, 'Tire restock', '2025-08-31 09:30:45'),
(10, 1, 'out', 5, 'service', 7, 'Used in engine tune-up', '2025-08-31 09:30:45'),
(11, 2, 'out', 2, 'service', 2, 'Used in brake service', '2025-08-31 09:30:45'),
(12, 4, 'out', 3, 'service', 1, 'Used in oil change', '2025-08-31 09:30:45'),
(13, 5, 'out', 2, 'service', 1, 'Used in oil change', '2025-08-31 09:30:45'),
(14, 15, 'in', 27, 'purchase', NULL, 'Restock from supplier', '2025-09-01 17:13:39'),
(15, 10, 'out', 1, 'service', 27, 'Used in service #27', '2025-09-01 17:53:04'),
(16, 16, 'out', 1, 'service', 27, 'Used in service #27', '2025-09-01 17:53:04'),
(17, 12, 'out', 1, 'service', 28, 'Used in service #28', '2025-09-01 18:03:13'),
(18, 8, 'out', 1, 'service', 29, 'Used in service #29', '2025-09-03 13:13:33'),
(19, 12, 'out', 1, 'service', 30, 'Used in service #30', '2025-09-03 14:09:14'),
(20, 13, 'in', 70, 'purchase', NULL, 'Restock from GTV Supplier', '2025-09-03 14:24:20'),
(21, 7, 'out', 1, 'service', 34, 'Used in service #34', '2025-09-07 15:19:35'),
(22, 6, 'out', 1, 'service', 35, 'Used in service #35', '2025-09-07 15:32:19');

-- --------------------------------------------------------

--
-- Table structure for table `system_config`
--

CREATE TABLE `system_config` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `config_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_config`
--

INSERT INTO `system_config` (`id`, `config_key`, `config_value`, `config_type`, `description`, `created_at`, `updated_at`) VALUES
(1, 'currency', 'USD', 'string', 'Default currency for the system', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(2, 'date_format', 'DD/MM/YYYY', 'string', 'Default date format', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(3, 'time_format', '24h', 'string', 'Default time format', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(4, 'language', 'en', 'string', 'Default language', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(5, 'timezone', 'Asia/Phnom_Penh', 'string', 'Default timezone', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(6, 'auto_backup', 'true', 'boolean', 'Enable automatic daily backups', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(7, 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(8, 'session_timeout', '3600', 'number', 'Session timeout in seconds', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(9, 'max_login_attempts', '5', 'number', 'Maximum login attempts before lockout', '2025-08-31 09:04:59', '2025-08-31 09:04:59'),
(10, 'password_expiry_days', '90', 'number', 'Password expiry in days', '2025-08-31 09:04:59', '2025-08-31 09:04:59');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('admin','manager','service_advisor','technician','viewer') NOT NULL DEFAULT 'viewer',
  `staff_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `staff_id`, `is_active`, `last_login`, `password_reset_token`, `password_reset_expires`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@gtvmotors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', 'System Administrator', 'admin', NULL, 1, NULL, NULL, NULL, '2025-08-26 10:10:52', '2025-08-26 10:10:52'),
(2, 'manager', 'manager@gtvmotors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', 'Service Manager', 'manager', NULL, 1, NULL, NULL, NULL, '2025-08-26 10:10:52', '2025-08-26 10:10:52'),
(3, 'advisor1', 'advisor1@gtvmotors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', 'Service Advisor', 'service_advisor', NULL, 1, NULL, NULL, NULL, '2025-08-26 10:10:52', '2025-08-26 10:10:52'),
(4, 'tech1', 'tech1@gtvmotors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', 'Lead Technician', 'technician', NULL, 1, NULL, NULL, NULL, '2025-08-26 10:10:52', '2025-08-26 10:10:52'),
(5, 'GTV Admin', 'gtv@gmail.com', '$2a$12$VDghFTldBC1JLSX3WESBoOq/DZQvqdyGrq8m8Z5JPYzjOG1eqVBTS', 'GTV Motor', 'admin', NULL, 1, '2025-09-13 07:31:04', NULL, NULL, '2025-08-26 10:31:47', '2025-09-13 07:31:04'),
(6, 'Chantrea', 'chantreagtv@gmail.com', '$2a$12$VciHRNe.68d4gERVIY3ypOsk/q8an.nnVnR6pBopF6mzcROqnnWy6', 'Sok Chantrea', 'manager', NULL, 1, NULL, NULL, NULL, '2025-08-31 09:56:46', '2025-08-31 09:56:46'),
(7, 'new1', 'new@gmail.com', '$2a$12$WlH.4Zgu6Xj1UFDC5ZtxfOHq0PCAFEYLPRCMdjMmkuZRh7sxT77vS', 'new', 'technician', NULL, 1, '2025-08-31 10:03:10', NULL, NULL, '2025-08-31 10:02:41', '2025-08-31 10:03:10'),
(8, 'CG', 'ahpea88@gmail.com', '$2a$12$XjRrJ/IlxYNg4.fyFZ.W1uVX6lX4sx7STrS0ALkyoyGcrwdyi7gy.', 'VANN RITHY', 'admin', 3, 1, '2025-09-26 04:17:41', NULL, NULL, '2025-09-15 14:19:31', '2025-09-26 04:17:41'),
(0, 'ddd', 'admin@rhtower.com', '$2y$10$jxiuxHYKZ6iM1b5qtasMnewQH.cM9XwZsuPzVN4Vio55L6Y22LOEW', 'VANN RITHY', 'technician', NULL, 1, '2025-09-24 19:03:57', NULL, NULL, '2025-09-24 19:03:49', '2025-09-24 19:03:57');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permission` varchar(100) NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `granted_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `expires_at`, `created_at`, `updated_at`) VALUES
('2422d908e32ee321dfc34463d983477bb2af80b5b1af4a1228b096c5196c17e96b410da0ac90852c1238f600d569b27ed6d4869a4d943bf72d05cf8dcd74a868', 5, '2025-09-04 14:03:34', '2025-08-28 14:03:34', '2025-08-28 14:03:34'),
('4b94a093feb4dcbcbf7a7e673d53f2e8f52f83d76edf0a1f9669580f295282d1904f1f5c36fa9e940322bbd2f43c2d2ac3ea89a1f7d959cd82ff4a5efc374d32', 5, '2025-09-06 16:34:17', '2025-08-30 16:34:17', '2025-08-30 16:34:17'),
('56e5e52fa8ba4986864c723d8bc9e15cab46e7ab0d358603297233799cd3593f46898004d003696b94bbd05b21b23f2b141ef356b9f91e1d4dffedeb10e335a7', 5, '2025-09-05 10:32:43', '2025-08-29 10:32:43', '2025-08-29 10:32:43'),
('60b92fabb65d079cf454a8ff96c014322e2a290156ff51505e8834fa251ab22cd0b183c4396670ad3c84f9ed3719577a67eb0617ce912f7350b9dac541c4d26a', 5, '2025-09-02 15:32:01', '2025-08-26 15:32:01', '2025-08-26 15:32:01'),
('8e0d0f74583ec32df6b22755e12ce8f5637d355c5c45cb678a7fd88d92d21376fa532e7c777739c7991241b3baae35c09b4360cd070411c9ca7a01faf1fa0b7e', 5, '2025-09-02 11:19:58', '2025-08-26 11:19:58', '2025-08-26 11:19:58'),
('b755684d03618e3cf32f3fe10cf818e5deed99c9989caa6d12548be9257b7667abd38c70a7a319b734dce7d2fcee8244f118315c46a0c88323379eee7e58a8b0', 5, '2025-09-03 09:44:18', '2025-08-27 09:44:18', '2025-08-27 09:44:18'),
('c8252bdb9ca0457a3336e77d0a0cf08805b6baafebe117b2b1e5e5ee5ef8fbd29e143968aee0fc58c6a5233c32e18235817d75b66aa5f35a1f3300b4cd4e4f1c', 5, '2025-09-20 07:31:04', '2025-09-13 07:31:04', '2025-09-13 07:31:04'),
('c8df2aeb0074efbcb7e8ed2f49885ee51e4cf0ffae99d11d0a4c42ac2aa2349d628e761b91965865ee27098201581d17123253ae1c0ae21574be1cceeadfb8ea', 5, '2025-09-02 10:32:48', '2025-08-26 10:32:48', '2025-08-26 10:32:48'),
('d0016ac77787a5b223661c39c57d5c849303dfbe9feed52f9b9180bb14cd164ba6abf64b5c7c95b26860107cf9b887f58a0d4189c101035cad9801c2fddb15ae', 5, '2025-09-10 13:38:55', '2025-09-03 13:38:55', '2025-09-03 13:38:55'),
('d5679e4996188ba96c42d494c6a0abf1eaa4083ab6295696527bb29d46999f0a71343096f391645171558f7f37134eaf06d7534d3d27353009094a37137dd8ed', 5, '2025-09-02 17:05:07', '2025-08-26 17:05:07', '2025-08-26 17:05:07'),
('e2f36fd0c9f675b1dd0f12ea4b583c35f2c5bcf1bad5d42058cc209152aa7d9be3282e8aa0405285feebb25453bcc5cc6f6e4c8e0fc0692f810e60bc5d469a18', 5, '2025-09-03 14:41:07', '2025-08-27 14:41:07', '2025-08-27 14:41:07'),
('f89b11b41e3b3ba0048e45946dbf0a3920fdff8b3381e70c02e323d6dd658449bb9e290d8f149d9aaaff67ee7aa430a3eaf0ba828ed59fab0bfc947dcf4aeb20', 8, '2025-09-22 14:19:40', '2025-09-15 14:19:40', '2025-09-15 14:19:40'),
('b6fc35c038a28968833a8af6467512fd1bd282e5c36dabf1a81c7a5a3a170ad5', 0, '2025-10-02 06:03:57', '2025-09-24 19:03:57', '2025-09-24 19:03:57'),
('8990cacf2ec222f91e175c3f75d6ebde45a3a8ee84f824717d1669f1286dd2ec', 8, '2025-10-03 15:17:41', '2025-09-26 04:17:41', '2025-09-26 04:17:41');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `model` varchar(50) NOT NULL,
  `vin_number` varchar(50) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `warranty_start_date` date DEFAULT NULL,
  `warranty_end_date` date DEFAULT NULL,
  `warranty_km_limit` int(11) DEFAULT 15000,
  `warranty_service_count` int(11) DEFAULT 0,
  `warranty_max_services` int(11) DEFAULT 2,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `vehicle_plate` varchar(20) DEFAULT 'UNKNOWN',
  `current_km` int(11) DEFAULT 50000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `customer_id`, `plate_number`, `model`, `vin_number`, `year`, `purchase_date`, `warranty_start_date`, `warranty_end_date`, `warranty_km_limit`, `warranty_service_count`, `warranty_max_services`, `created_at`, `updated_at`, `vehicle_plate`, `current_km`) VALUES
(1, 1, '2CD-7960', 'SOBEN', 'LUYJB2G27SA009637', 2023, '2023-01-15', '2023-01-15', '2026-01-15', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE001', 50000),
(2, 2, '2CF-6609', 'SOBEN', 'LUYJB2G23SA009764', 2023, '2023-02-20', '2023-02-20', '2026-02-20', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE002', 50000),
(3, 3, '2CD-3436', 'SOBEN', 'LUYJB2G25SA003013', 2022, '2022-08-10', '2022-08-10', '2025-08-10', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE003', 50000),
(4, 4, '2CB-5461', 'SOBEN', 'LUYJB2G29SA003080', 2023, '2023-03-05', '2023-03-05', '2026-03-05', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE004', 50000),
(5, 5, '2CD-7401', 'SOBEN', 'LUYJB2G22SA005317', 2023, '2023-04-12', '2023-04-12', '2026-04-12', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE005', 50000),
(6, 6, '2BZ-8649', 'KRUSAR', 'L3AZ1CK36RYA90027', 2022, '2022-11-30', '2022-11-30', '2025-11-30', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE006', 50000),
(7, 7, '2BY-0284', 'SOBEN', 'LUYJB2G25RA007895', 2023, '2023-05-18', '2023-05-18', '2026-05-18', 15000, 1, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE007', 50000),
(8, 8, '2D-0646', 'KESSOR', 'LJ12EKS33R4714414', 2022, '2022-09-25', '2022-09-25', '2025-09-25', 15000, 0, 2, '2025-08-25 16:27:30', '2025-08-30 17:13:47', 'PLATE008', 50000),
(9, 9, '2BC-3456', 'KAIN', 'ghhjju', 2023, '2025-08-26', NULL, NULL, 15000, 0, 2, '2025-08-26 09:11:48', '2025-08-30 17:13:47', 'PLATE009', 50000),
(11, 11, 'BTB 2BA-5456', 'KOUPREY', 'LYUI8679THY', 2020, NULL, NULL, NULL, 15000, 0, 2, '2025-08-27 15:51:32', '2025-08-30 17:13:47', 'PLATE011', 50000),
(15, 15, 'KRUSAR BTB 2CD-3537', 'KRUSAR', 'LYUI8679THY', 2025, '2025-08-28', '2025-08-28', '2025-12-28', 15000, 0, 2, '2025-08-28 16:15:52', '2025-08-30 17:13:47', 'PLATE015', 50000),
(17, 1, 'ABC-1234', 'Toyota Camry', '1HGBH41JXMN109186', 2020, '2020-03-15', NULL, NULL, 15000, 0, 2, '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'ABC-1234', 50000),
(18, 2, 'XYZ-5678', 'Honda Civic', '2T1BURHE0JC123456', 2019, '2019-07-22', NULL, NULL, 15000, 0, 2, '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'XYZ-5678', 50000),
(19, 3, 'DEF-9012', 'Ford Ranger', '3VWDX7AJ5DM123456', 2021, '2021-01-10', NULL, NULL, 15000, 0, 2, '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'DEF-9012', 50000),
(20, 4, 'GHI-3456', 'Nissan X-Trail', '4T1B11HK5JU123456', 2018, '2018-11-05', NULL, NULL, 15000, 0, 2, '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'GHI-3456', 50000),
(21, 5, 'JKL-7890', 'Mazda CX-5', '5YJSA1E47HF123456', 2022, '2022-05-20', NULL, NULL, 15000, 0, 2, '2025-08-31 09:27:46', '2025-09-01 16:30:11', 'JKL-7890', 50000),
(42, 42, '2AD-4968', 'KOUPREY', 'LYUI8679THY567', 2025, '2025-09-01', '2025-09-01', '2025-10-01', 15000, 0, 2, '2025-09-01 14:20:27', '2025-09-01 16:30:11', '2AD-4968', 0),
(43, 42, '2AD-4960', 'KOUPREY', 'LYUI8679THY567', 2023, '2025-09-01', '2025-10-01', '2025-10-31', 15000, 0, 2, '2025-09-01 14:50:41', '2025-09-01 16:30:11', '2AD-4960', 0),
(44, 11, '2BD-5678', 'KESSOR', 'LYUI8679THY567', 2023, '2025-09-02', '2025-09-02', '2025-10-02', 15000, 0, 2, '2025-09-01 17:29:55', '2025-09-01 17:29:55', 'UNKNOWN', 0),
(45, 44, '2CF-4567', 'KOUPREY', 'LYUI8679THY567t', 2005, '2025-09-02', '2025-09-02', '2025-12-02', 15000, 0, 2, '2025-09-01 17:43:56', '2025-09-01 17:43:56', 'UNKNOWN', 0),
(46, 44, '156458', 'KOUPREY', 'LYUI8679THY567t', 2005, '2025-09-02', '2025-09-02', '2025-12-02', 15000, 0, 2, '2025-09-01 17:52:58', '2025-09-01 17:52:58', 'UNKNOWN', 0),
(47, 42, 'BTB 2BA-5456', 'KOUPREY', 'LYUI8679THY567t', 2023, '2025-09-18', '2025-09-17', '2025-11-29', 15000, 0, 2, '2025-09-01 18:03:11', '2025-09-01 18:03:11', 'UNKNOWN', 0),
(48, 46, '2BD-0987', 'KRUSAR', 'LYUI8679THY786RT', 2024, '2025-09-03', '2025-09-04', '2026-09-03', 15000, 0, 2, '2025-09-03 14:09:09', '2025-09-03 14:09:09', 'UNKNOWN', 0),
(49, 47, 'BTB 2BA-5456', 'KAIN', 'LYUI8679THY', 2023, '2025-09-06', NULL, NULL, 15000, 0, 2, '2025-09-06 09:55:33', '2025-09-06 09:55:33', 'UNKNOWN', 0),
(50, 11, '1T-2392', 'KESSOR', 'LYUI8679THY', 2018, '2025-09-06', NULL, NULL, 15000, 0, 2, '2025-09-06 09:59:43', '2025-09-06 09:59:43', 'UNKNOWN', 0),
(51, 43, 'SOBEN 2AD-4965', 'KESSOR', NULL, NULL, NULL, NULL, NULL, 15000, 0, 2, '2025-09-06 10:00:58', '2025-09-06 10:00:58', 'UNKNOWN', 0),
(52, 48, '2BH-4578', 'KAIN', 'KLT0976LJ76', 2024, '2025-09-08', '2025-09-08', '2025-10-08', 15000, 0, 2, '2025-09-07 15:19:33', '2025-09-07 15:19:33', 'UNKNOWN', 0),
(53, 49, '2BH-4578', 'KOUPREY', 'KLT0976LJ76', 2024, '2025-09-08', '2025-09-08', '2025-10-08', 15000, 0, 2, '2025-09-07 15:32:18', '2025-09-07 15:32:18', 'UNKNOWN', 0);

-- --------------------------------------------------------

--
-- Table structure for table `warranties`
--

CREATE TABLE `warranties` (
  `id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `warranty_type` enum('standard','extended','premium') NOT NULL DEFAULT 'standard',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `km_limit` int(11) NOT NULL DEFAULT 15000,
  `max_services` int(11) NOT NULL DEFAULT 2,
  `terms_conditions` text DEFAULT NULL,
  `status` enum('active','expired','suspended','cancelled') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `warranty_start_date` date DEFAULT curdate(),
  `warranty_end_date` date DEFAULT (curdate() + interval 1 year),
  `warranty_cost_covered` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warranties`
--

INSERT INTO `warranties` (`id`, `vehicle_id`, `warranty_type`, `start_date`, `end_date`, `km_limit`, `max_services`, `terms_conditions`, `status`, `created_at`, `updated_at`, `warranty_start_date`, `warranty_end_date`, `warranty_cost_covered`) VALUES
(1, 1, 'standard', '2023-01-15', '2026-01-15', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(2, 2, 'standard', '2023-02-20', '2026-02-20', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(3, 3, 'standard', '2022-08-10', '2025-08-10', 15000, 2, NULL, 'expired', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(4, 4, 'standard', '2023-03-05', '2026-03-05', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(5, 5, 'standard', '2023-04-12', '2026-04-12', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(6, 6, 'standard', '2022-11-30', '2025-11-30', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(7, 7, 'standard', '2023-05-18', '2026-05-18', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(8, 8, 'standard', '2022-09-25', '2025-09-25', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(10, 15, 'standard', '2025-08-28', '2028-08-28', 15000, 2, NULL, 'active', '2025-08-29 16:25:33', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(16, 1, 'standard', '2023-01-15', '2026-01-15', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(17, 2, 'standard', '2023-02-20', '2026-02-20', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(18, 3, 'standard', '2022-08-10', '2025-08-10', 15000, 2, NULL, 'expired', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(19, 4, 'standard', '2023-03-05', '2026-03-05', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(20, 5, 'standard', '2023-04-12', '2026-04-12', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(21, 6, 'standard', '2022-11-30', '2025-11-30', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(22, 7, 'standard', '2023-05-18', '2026-05-18', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(23, 8, 'standard', '2022-09-25', '2025-09-25', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(24, 9, 'standard', '2025-08-26', '2028-08-26', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00),
(26, 15, 'standard', '2025-08-28', '2025-12-28', 15000, 2, NULL, 'active', '2025-08-29 16:33:12', '2025-08-30 17:13:47', '2025-08-31', '2026-08-31', 500.00);

--
-- Triggers `warranties`
--
DELIMITER $$
CREATE TRIGGER `update_vehicle_warranty` AFTER INSERT ON `warranties` FOR EACH ROW BEGIN
  UPDATE vehicles 
  SET warranty_start_date = NEW.start_date,
      warranty_end_date = NEW.end_date,
      warranty_km_limit = NEW.km_limit,
      warranty_max_services = NEW.max_services
  WHERE id = NEW.vehicle_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `warranty_claims`
--

CREATE TABLE `warranty_claims` (
  `id` int(11) NOT NULL,
  `warranty_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `claim_type` enum('repair','replacement','maintenance') NOT NULL,
  `description` text NOT NULL,
  `claim_date` date NOT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `actual_cost` decimal(10,2) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warranty_services`
--

CREATE TABLE `warranty_services` (
  `id` int(11) NOT NULL,
  `warranty_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `service_date` date NOT NULL,
  `km_at_service` int(11) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `cost_covered` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warranty_services`
--

INSERT INTO `warranty_services` (`id`, `warranty_id`, `service_id`, `service_date`, `km_at_service`, `service_type`, `cost_covered`, `notes`, `created_at`) VALUES
(1, 1, 1, '2025-07-10', 15000, 'Oil Change - SOBEN', 450.00, NULL, '2025-08-29 16:25:33'),
(2, 2, 2, '2025-06-17', 8000, 'Oil Change - KAIN', 95.00, NULL, '2025-08-29 16:25:33'),
(3, 3, 3, '2025-06-28', 25000, 'Oil Change - KOUPREY', 280.00, NULL, '2025-08-29 16:25:33'),
(4, 4, 4, '2025-07-07', 5000, 'Oil Change - SOBEN', 450.00, NULL, '2025-08-29 16:25:33'),
(5, 5, 5, '2025-06-09', 18000, 'Brake System Repair', 180.00, NULL, '2025-08-29 16:25:33'),
(6, 6, 6, '2025-07-07', 44000, 'Engine Repair', 250.00, NULL, '2025-08-29 16:25:33'),
(7, 7, 7, '2025-06-10', 300, 'Oil Change - SOBEN', 450.00, NULL, '2025-08-29 16:25:33');

-- --------------------------------------------------------

--
-- Table structure for table `warranty_status`
--

CREATE TABLE `warranty_status` (
  `id` int(11) DEFAULT NULL,
  `vehicle_id` int(11) DEFAULT NULL,
  `warranty_type` enum('standard','extended','premium') DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `km_limit` int(11) DEFAULT NULL,
  `max_services` int(11) DEFAULT NULL,
  `terms_conditions` text DEFAULT NULL,
  `status` enum('active','expired','suspended','cancelled') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `warranty_start_date` date DEFAULT NULL,
  `warranty_end_date` date DEFAULT NULL,
  `warranty_cost_covered` decimal(10,2) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `vehicle_plate` varchar(20) DEFAULT NULL,
  `vehicle_model` varchar(50) DEFAULT NULL,
  `days_remaining` int(7) DEFAULT NULL,
  `expiry_status` varchar(13) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
