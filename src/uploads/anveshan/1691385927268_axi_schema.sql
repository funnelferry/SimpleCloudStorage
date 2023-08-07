CREATE TABLE `project` (
  `id` INTEGER PRIMARY KEY,
  `name` TEXT NOT NULL,
  `created_by` TEXT NOT NULL
);

CREATE TABLE `recipe` (
  `id` INTEGER PRIMARY KEY,
  `project_id` INTEGER NOT NULL,
  `name` TEXT NOT NULL
);

CREATE TABLE `variation` (
  `id` INTEGER PRIMARY KEY,
  `recipe_id` INTEGER NOT NULL,
  `name` TEXT NOT NULL
);

CREATE TABLE `rec` (
  `id` INTEGER PRIMARY KEY,
  `variation_id` INTEGER NOT NULL,
  `name` TEXT NOT NULL
);

CREATE TABLE `model` (
  `id` INTEGER PRIMARY KEY,
  `project_id` INTEGER NOT NULL,
  `name` TEXT NOT NULL
);

CREATE TABLE `model_config` (
  `id` INTEGER PRIMARY KEY,
  `model_id` INTEGER NOT NULL,
  `status` TEXT NOT NULL,
  `total` INTEGER,
  `learning` INTEGER,
  `validation` INTEGER,
  `test` INTEGER
);

CREATE TABLE `model_info` (
  `id` INTEGER PRIMARY KEY,
  `model_pid` INTEGER NOT NULL,
  `project` TEXT NOT NULL,
  `model_id` TEXT NOT NULL,
  `created_by` TEXT NOT NULL,
  `created_date` DATE NOT NULL,
  `tool_version` TEXT NOT NULL,
  `comment` TEXT NOT NULL
);

CREATE TABLE `learning_info` (
  `id` INTEGER PRIMARY KEY,
  `model_id` INTEGER NOT NULL,
  `bump` INTEGER NOT NULL,
  `recipe` TEXT NOT NULL,
  `variation` TEXT NOT NULL,
  `rec` TEXT NOT NULL,
  `location_x` INTEGER NOT NULL,
  `location_y` INTEGER NOT NULL,
  `label` TEXT NOT NULL,
  `ng_class` TEXT NOT NULL,
  `learning` TEXT NOT NULL,
  `validation` TEXT NOT NULL
);

CREATE TABLE `selected_recipe` (
  `id` INTEGER PRIMARY KEY,
  `model_id` INTEGER NOT NULL,
  `recipe_name` TEXT
);

CREATE TABLE `selected_variation` (
  `id` INTEGER PRIMARY KEY,
  `selected_recipe_id` INTEGER NOT NULL,
  `variation_name` TEXT
);

CREATE TABLE `selected_rec` (
  `id` INTEGER PRIMARY KEY,
  `selected_variation_id` INTEGER NOT NULL,
  `rec_name` TEXT
);

ALTER TABLE `recipe` ADD FOREIGN KEY (`project_id`) REFERENCES `project` (`id`);

ALTER TABLE `variation` ADD FOREIGN KEY (`recipe_id`) REFERENCES `recipe` (`id`);

ALTER TABLE `rec` ADD FOREIGN KEY (`variation_id`) REFERENCES `variation` (`id`);

ALTER TABLE `model` ADD FOREIGN KEY (`project_id`) REFERENCES `project` (`id`);

ALTER TABLE `model_config` ADD FOREIGN KEY (`model_id`) REFERENCES `model` (`id`);

ALTER TABLE `model_info` ADD FOREIGN KEY (`model_id`) REFERENCES `model` (`id`);

ALTER TABLE `learning_info` ADD FOREIGN KEY (`model_id`) REFERENCES `model` (`id`);

ALTER TABLE `selected_recipe` ADD FOREIGN KEY (`model_id`) REFERENCES `model` (`id`);

ALTER TABLE `selected_variation` ADD FOREIGN KEY (`selected_recipe_id`) REFERENCES `selected_recipe` (`id`);

ALTER TABLE `selected_rec` ADD FOREIGN KEY (`selected_variation_id`) REFERENCES `selected_variation` (`id`);
