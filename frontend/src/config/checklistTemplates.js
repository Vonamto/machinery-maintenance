// frontend/src/config/checklistTemplates.js
/**
 * Dynamic checklist templates based on equipment type
 * Business-aligned sections and items
 * English keys ONLY (Arabic handled via translations)
 */

export const CHECKLIST_TEMPLATES = {
  Truck: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "windshield" },
        { key: "horn" },
        { key: "brakes" },
        { key: "mirrors" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "tail_lights" },
        { key: "brake_lights" },
        { key: "turn_signals" },
        { key: "reverse_lights" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "tire_air_pressure" },
        { key: "condition_of_the_tire_rubber" },
        { key: "spare_tire_condition" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "hydraulic_jack" },
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "warning_triangle" }
      ]
    }
  ],

  Forklift: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "tail_lights" },
        { key: "brake_lights" },
        { key: "reverse_lights" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "tire_air_pressure" },
        { key: "condition_of_the_tire_rubber" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "warning_triangle" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    }
  ],

  Crane: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "tail_lights" },
        { key: "brake_lights" },
        { key: "reverse_lights" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "tire_air_pressure" },
        { key: "condition_of_the_tire_rubber" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "warning_triangle" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "lifting_system",
      titleKey: "checklist.sections.lifting_system",
      items: [
        { key: "lifting_hook" },
        { key: "anti-two_block_device_for_wire_rope" },
        { key: "lifting_wire_rope" },
        { key: "boom,_pins,_bolting" },
        { key: "sheaves" }
      ]
    }
  ],

  // =========================================================
  // BULLDOZER
  // =========================================================
  Bulldozer: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" },
        { key: "brakes" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "hydraulic_oil_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "warning_lights_beacon" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "tracks_undercarriage",
      titleKey: "checklist.sections.tracks_undercarriage",
      items: [
        { key: "track_condition" },
        { key: "track_tension" },
        { key: "undercarriage_condition" }
      ]
    },
    {
      sectionKey: "blade_work_equipment",
      titleKey: "checklist.sections.blade_work_equipment",
      items: [
        { key: "blade_condition" },
        { key: "blade_hydraulic_operation" },
        { key: "pins_and_mounting_secure" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "emergency_stop_safety_device" }
      ]
    }
  ],

  // =========================================================
  // EXCAVATOR
  // Includes Pelle hydraulique through Machinery_Types mapping
  // =========================================================
  Excavator: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" },
        { key: "brakes" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "hydraulic_oil_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "warning_lights_beacon" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "tracks_undercarriage",
      titleKey: "checklist.sections.tracks_undercarriage",
      items: [
        { key: "track_condition" },
        { key: "track_tension" },
        { key: "undercarriage_condition" }
      ]
    },
    {
      sectionKey: "boom_arm_bucket",
      titleKey: "checklist.sections.boom_arm_bucket",
      items: [
        { key: "boom_arm_condition" },
        { key: "bucket_attachment_condition" },
        { key: "pins_and_mounting_secure" },
        { key: "boom_arm_attachment_operation" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "emergency_stop_safety_device" }
      ]
    }
  ],

  // =========================================================
  // GRADER
  // =========================================================
  Grader: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" },
        { key: "brakes" },
        { key: "steering_operation" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "hydraulic_oil_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "warning_lights_beacon" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "condition_of_the_tire_rubber" },
        { key: "tire_air_pressure" },
        { key: "wheels_lug_nuts_secure" }
      ]
    },
    {
      sectionKey: "blade_grading_system",
      titleKey: "checklist.sections.blade_grading_system",
      items: [
        { key: "blade_condition" },
        { key: "blade_grading_operation" },
        { key: "blade_cutting_edge_condition" },
        { key: "pins_and_mounting_secure" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "emergency_stop_safety_device" }
      ]
    }
  ],

  // =========================================================
  // COMPACTOR
  // =========================================================
  Compactor: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" },
        { key: "brakes" },
        { key: "steering_operation" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "hydraulic_oil_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "warning_lights_beacon" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "condition_of_the_tire_rubber" },
        { key: "tire_air_pressure" },
        { key: "wheels_lug_nuts_secure" }
      ]
    },
    {
      sectionKey: "drum_compaction_system",
      titleKey: "checklist.sections.drum_compaction_system",
      items: [
        { key: "drum_condition" },
        { key: "drum_scraper_condition" },
        { key: "vibration_system_operation" },
        { key: "no_abnormal_vibration_or_noise" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "emergency_stop_safety_device" }
      ]
    }
  ],

  // =========================================================
  // LOADER
  // =========================================================
  Loader: [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" },
        { key: "brakes" },
        { key: "steering_operation" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "hydraulic_oil_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "warning_lights_beacon" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "condition_of_the_tire_rubber" },
        { key: "tire_air_pressure" },
        { key: "wheels_lug_nuts_secure" }
      ]
    },
    {
      sectionKey: "loader_arms_bucket",
      titleKey: "checklist.sections.loader_arms_bucket",
      items: [
        { key: "loader_arms_condition" },
        { key: "bucket_attachment_condition" },
        { key: "pins_and_mounting_secure" },
        { key: "loader_arms_bucket_operation" }
      ]
    },
    {
      sectionKey: "emergency_equipment",
      titleKey: "checklist.sections.emergency_equipment",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "emergency_stop_safety_device" }
      ]
    }
  ],

  // =========================================================
  // SKID-STEER LOADER
  // Assumed wheeled version
  // =========================================================
  "Skid-Steer Loader": [
    {
      sectionKey: "general_inspection",
      titleKey: "checklist.sections.general_inspection",
      items: [
        { key: "vehicle_cleanliness" },
        { key: "driver's_seat" },
        { key: "seat_belt" },
        { key: "horn" },
        { key: "mirrors" },
        { key: "brakes_parking_brake" },
        { key: "steering_travel_controls" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "fluids_check",
      titleKey: "checklist.sections.fluids_check",
      items: [
        { key: "fuel_level" },
        { key: "oil_level" },
        { key: "water_level" },
        { key: "hydraulic_oil_level" },
        { key: "no_warning_lights_on" }
      ]
    },
    {
      sectionKey: "electrical",
      titleKey: "checklist.sections.electrical",
      items: [
        { key: "headlights" },
        { key: "warning_lights_beacon" },
        { key: "reversing_alarm" }
      ]
    },
    {
      sectionKey: "hydraulic_system",
      titleKey: "checklist.sections.hydraulic_system",
      items: [
        { key: "hydraulic_cylinders" },
        { key: "hydraulic_hose" },
        { key: "hydraulic_fittings" },
        { key: "hydraulic_leaks" }
      ]
    },
    {
      sectionKey: "tires",
      titleKey: "checklist.sections.tires",
      items: [
        { key: "condition_of_the_tire_rubber" },
        { key: "tire_air_pressure" },
        { key: "wheels_lug_nuts_secure" }
      ]
    },
    {
      sectionKey: "loader_arms_attachment",
      titleKey: "checklist.sections.loader_arms_attachment",
      items: [
        { key: "loader_arms_condition" },
        { key: "bucket_attachment_condition" },
        { key: "pins_and_mounting_secure" },
        { key: "attachment_securely_connected" },
        { key: "loader_arms_attachment_operation" }
      ]
    },
    {
      sectionKey: "safety_system",
      titleKey: "checklist.sections.safety_system",
      items: [
        { key: "fire_extinguisher" },
        { key: "first_aid_kit" },
        { key: "operator_safety_interlock_system" }
      ]
    }
  ]
};

// Utility helpers
export const getChecklistTemplate = (equipmentType) => {
  return CHECKLIST_TEMPLATES[equipmentType] || [];
};

export const getAllEquipmentTypes = () => {
  return Object.keys(CHECKLIST_TEMPLATES);
};
