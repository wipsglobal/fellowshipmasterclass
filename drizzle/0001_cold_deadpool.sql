CREATE TABLE `academicQualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`qualification` varchar(100) NOT NULL,
	`discipline` varchar(100) NOT NULL,
	`institution` varchar(255) NOT NULL,
	`yearObtained` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academicQualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationNumber` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`cohortId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`title` varchar(50),
	`dateOfBirth` varchar(10),
	`gender` enum('male','female','other'),
	`nationality` varchar(100),
	`countryOfResidence` varchar(100),
	`contactAddress` text,
	`email` varchar(320) NOT NULL,
	`mobileNumber` varchar(20) NOT NULL,
	`linkedinProfile` varchar(500),
	`participationMode` enum('physical','virtual') NOT NULL,
	`selectedTracks` json NOT NULL,
	`highestQualification` varchar(100),
	`classOfDegree` varchar(50),
	`ibakmmembershipNumber` varchar(100),
	`isIbakmmember` boolean DEFAULT false,
	`totalYearsExperience` int,
	`eligibilityCategory` varchar(255) NOT NULL,
	`statementOfPurpose` text NOT NULL,
	`applicationFee` decimal(10,2) NOT NULL,
	`paymentStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentReference` varchar(100),
	`admissionStatus` enum('approved','pending','declined') NOT NULL DEFAULT 'pending',
	`remarks` text,
	`verifiedBy` varchar(255),
	`dateOfApproval` timestamp,
	`status` enum('draft','submitted','under_review','approved','declined') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `applications_applicationNumber_unique` UNIQUE(`applicationNumber`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`userId` int NOT NULL,
	`certificateNumber` varchar(50) NOT NULL,
	`trackCode` varchar(20) NOT NULL,
	`postNominals` varchar(20) NOT NULL,
	`issuedDate` timestamp NOT NULL DEFAULT (now()),
	`certificateUrl` text,
	`status` enum('generated','issued','revoked') NOT NULL DEFAULT 'generated',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNumber_unique` UNIQUE(`certificateNumber`)
);
--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`applicationDeadline` timestamp NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`capacity` int NOT NULL DEFAULT 100,
	`status` enum('open','closed','completed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cohorts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employmentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`organization` varchar(255) NOT NULL,
	`positionHeld` varchar(100) NOT NULL,
	`periodFrom` varchar(10) NOT NULL,
	`periodTo` varchar(10) NOT NULL,
	`keyResponsibilities` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employmentHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feeConfiguration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cohortId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'NGN',
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feeConfiguration_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'NGN',
	`paystackReference` varchar(100),
	`paystackAccessCode` varchar(100),
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paidAt` timestamp,
	`receiptUrl` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_paystackReference_unique` UNIQUE(`paystackReference`)
);
--> statement-breakpoint
CREATE TABLE `professionalQualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`professionalBody` varchar(100) NOT NULL,
	`designation` varchar(100) NOT NULL,
	`yearAdmitted` int NOT NULL,
	`membershipStatus` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `professionalQualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`refereeName` varchar(255) NOT NULL,
	`positionOrganization` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportingDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`documentType` enum('academic_certificate','professional_certificate','cv','passport_photo','identification','other') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`cloudinaryUrl` text NOT NULL,
	`cloudinaryPublicId` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(50),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportingDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tracks_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);