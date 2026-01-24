/**
 * Checklist Definitions
 *
 * This file is the SINGLE SOURCE OF TRUTH for all checklist structures.
 *
 * IMPORTANT RULES:
 * - English only (logic & storage)
 * - NO UI text rendering here
 * - NO translations here
 * - NO Google Sheet logic here
 *
 * UI will translate labels using translation keys.
 * Google Sheets will store ONLY English values.
 */

export const EQUIPMENT_TYPES = {
  TRUCK: "Truck",
  FORKLIFT: "Forklift",
  CRANE: "Crane"
};

export const CHECKLIST_DEFINITIONS = {
  [EQUIPMENT_TYPES.TRUCK]: {
    sections: [
      {
        id: "general_inspection",
        translationKey: "checklist.sections.generalInspection",
        items: [
          { id: "vehicle_cleanliness", translationKey: "checklist.items.vehicleCleanliness" },
          { id: "drivers_seat", translationKey: "checklist.items.driversSeat" },
          { id: "seat_belt", translationKey: "checklist.items.seatBelt" },
          { id: "windshield", translationKey: "checklist.items.windshield" },
          { id: "horn", translationKey: "checklist.items.horn" },
          { id: "brakes", translationKey: "checklist.items.brakes" },
          { id: "mirrors", translationKey: "checklist.items.mirrors" },
          { id: "reversing_alarm", translationKey: "checklist.items.reversingAlarm" }
        ]
      },
      {
        id: "fluids_check",
        translationKey: "checklist.sections.fluidsCheck",
        items: [
          { id: "fuel_level", translationKey: "checklist.items.fuelLevel" },
          { id: "oil_level", translationKey: "checklist.items.oilLevel" },
          { id: "water_level", translationKey: "checklist.items.waterLevel" },
          { id: "no_warning_lights", translationKey: "checklist.items.noWarningLights" }
        ]
      },
      {
        id: "electrical",
        translationKey: "checklist.sections.electrical",
        items: [
          { id: "headlights", translationKey: "checklist.items.headlights" },
          { id: "tail_lights", translationKey: "checklist.items.tailLights" },
          { id: "brake_lights", translationKey: "checklist.items.brakeLights" },
          { id: "turn_signals", translationKey: "checklist.items.turnSignals" },
          { id: "reverse_lights", translationKey: "checklist.items.reverseLights" }
        ]
      },
      {
        id: "tires",
        translationKey: "checklist.sections.tires",
        items: [
          { id: "tire_air_pressure", translationKey: "checklist.items.tireAirPressure" },
          { id: "tire_rubber_condition", translationKey: "checklist.items.tireRubberCondition" },
          { id: "spare_tire_condition", translationKey: "checklist.items.spareTireCondition" }
        ]
      },
      {
        id: "emergency_equipment",
        translationKey: "checklist.sections.emergencyEquipment",
        items: [
          { id: "hydraulic_jack", translationKey: "checklist.items.hydraulicJack" },
          { id: "fire_extinguisher", translationKey: "checklist.items.fireExtinguisher" },
          { id: "first_aid_kit", translationKey: "checklist.items.firstAidKit" },
          { id: "warning_triangle", translationKey: "checklist.items.warningTriangle" }
        ]
      }
    ]
  },

  [EQUIPMENT_TYPES.FORKLIFT]: {
    sections: [
      {
        id: "general_inspection",
        translationKey: "checklist.sections.generalInspection",
        items: [
          { id: "vehicle_cleanliness", translationKey: "checklist.items.vehicleCleanliness" },
          { id: "drivers_seat", translationKey: "checklist.items.driversSeat" },
          { id: "seat_belt", translationKey: "checklist.items.seatBelt" },
          { id: "horn", translationKey: "checklist.items.horn" },
          { id: "brakes", translationKey: "checklist.items.brakes" }
        ]
      },
      {
        id: "fluids_check",
        translationKey: "checklist.sections.fluidsCheck",
        items: [
          { id: "fuel_level", translationKey: "checklist.items.fuelLevel" },
          { id: "oil_level", translationKey: "checklist.items.oilLevel" },
          { id: "water_level", translationKey: "checklist.items.waterLevel" },
          { id: "no_warning_lights", translationKey: "checklist.items.noWarningLights" }
        ]
      },
      {
        id: "electrical",
        translationKey: "checklist.sections.electrical",
        items: [
          { id: "headlights", translationKey: "checklist.items.headlights" },
          { id: "tail_lights", translationKey: "checklist.items.tailLights" },
          { id: "brake_lights", translationKey: "checklist.items.brakeLights" }
        ]
      },
      {
        id: "tires",
        translationKey: "checklist.sections.tires",
        items: [
          { id: "tire_air_pressure", translationKey: "checklist.items.tireAirPressure" },
          { id: "tire_rubber_condition", translationKey: "checklist.items.tireRubberCondition" }
        ]
      },
      {
        id: "hydraulic_system",
        translationKey: "checklist.sections.hydraulicSystem",
        items: [
          { id: "hydraulic_cylinders", translationKey: "checklist.items.hydraulicCylinders" },
          { id: "hydraulic_hose", translationKey: "checklist.items.hydraulicHose" },
          { id: "hydraulic_fittings", translationKey: "checklist.items.hydraulicFittings" },
          { id: "hydraulic_leaks", translationKey: "checklist.items.hydraulicLeaks" }
        ]
      },
      {
        id: "emergency_equipment",
        translationKey: "checklist.sections.emergencyEquipment",
        items: [
          { id: "fire_extinguisher", translationKey: "checklist.items.fireExtinguisher" },
          { id: "first_aid_kit", translationKey: "checklist.items.firstAidKit" },
          { id: "warning_triangle", translationKey: "checklist.items.warningTriangle" }
        ]
      }
    ]
  },

  [EQUIPMENT_TYPES.CRANE]: {
    sections: [
      ...CHECKLIST_DEFINITIONS?.[EQUIPMENT_TYPES.FORKLIFT]?.sections || [],
      {
        id: "lifting_system",
        translationKey: "checklist.sections.liftingSystem",
        items: [
          { id: "lifting_hook", translationKey: "checklist.items.liftingHook" },
          { id: "anti_two_block", translationKey: "checklist.items.antiTwoBlock" },
          { id: "lifting_wire_rope", translationKey: "checklist.items.liftingWireRope" },
          { id: "boom_pins_bolting", translationKey: "checklist.items.boomPinsBolting" },
          { id: "sheaves", translationKey: "checklist.items.sheaves" }
        ]
      }
    ]
  }
};
