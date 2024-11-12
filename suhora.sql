-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 12, 2024 at 04:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `suhora`
--

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `published_at` datetime DEFAULT NULL,
  `status` enum('draft','published','archived','') NOT NULL DEFAULT 'draft',
  `image` varchar(255) NOT NULL,
  `tags` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `title`, `slug`, `description`, `created_at`, `updated_at`, `published_at`, `status`, `image`, `tags`) VALUES
(1, 'SUHORA has signed MoU with Thiagarajar College of Engineering, Madurai', 'mou_thiagarajar_madurai', 'Suhora has signed a Memorandum of Understanding (MoU) with Thiagarajar College of Engineering, Madurai, to strengthen industry-academia collaboration. This partnership aims to equip students with industry-relevant skills and expose them to real-world challenges in the geospatial and space technology domains. As part of the MoU, Suhora will deliver specialized industrial training, offer internships, and collaborate on research projects, providing students with hands-on experience and opportunities in the growing Indian space sector. This initiative marks a significant step toward developing STEM professionals who will contribute to India\'s Geospatial Economy and accomplish the Indian Space Dream.', '2024-11-09 15:03:40', '2024-11-09 15:03:40', '2024-11-09 16:01:55', 'draft', 'http://suhora.com/assets/images/SUHORA-Tce-MoU-signing.webp', 'event_news'),
(3, 'umg2609', 'ekjdkedbede', 'final222 has signed a Memorandum of Understanding (MoU) with Thiagarajar College of Engineering, Madurai, to strengthen industry-academia collaboration. This partnership aims to equip students with industry-relevant skills and expose them to real-world challenges in the geospatial and space technology domains. As part of the MoU, Suhora will deliver specialized industrial training, offer internships, and collaborate on research projects, providing students with hands-on experience and opportunities in the growing Indian space sector. This initiative marks a significant step toward developing STEM professionals who will contribute to India\'s Geospatial Economy and accomplish the Indian Space Dream.', '2024-11-09 16:26:24', '2024-11-09 16:26:24', NULL, 'draft', 'http://suhora.com/assets/images/SUHORA-SatVu-Contract-Signing-e1717489162101.webp', 'umg026');

-- --------------------------------------------------------

--
-- Table structure for table `clientreachout`
--

CREATE TABLE `clientreachout` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `clientreachout`
--

INSERT INTO `clientreachout` (`id`, `name`, `email`, `phone`, `message`, `created_at`) VALUES
(1, 'Umang from carnival tech', 'umg@gmail.com', '+91 9328641633', 'Hello i want to create website please rechout to me.', '2024-11-10 16:18:19'),
(2, 'Umang from carnival tech', 'umg@gmail.com', '+91 9328641633', 'Hello i want to create website please rechout to me.', '2024-11-10 16:23:00'),
(4, 'adam from us', 'adm@gmail.com', '+91 5161616516', 'Hello i want to create website please rechout to me.', '2024-11-10 16:46:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `clientreachout`
--
ALTER TABLE `clientreachout`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `clientreachout`
--
ALTER TABLE `clientreachout`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
