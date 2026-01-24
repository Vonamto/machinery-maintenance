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
  ]
};

// Utility helpers
export const getChecklistTemplate = (equipmentType) => {
  return CHECKLIST_TEMPLATES[equipmentType] || [];
};

export const getAllEquipmentTypes = () => {
  return Object.keys(CHECKLIST_TEMPLATES);
};
