// frontend/src/config/checklistTemplates.js
/**
 * Dynamic checklist templates based on equipment type
 * Each equipment type has different sections and items
 */

export const CHECKLIST_TEMPLATES = {
  "Truck": [
    {
      section: "truckSafety",
      title: "truckSafetyTitle",
      items: [
        { id: "seatbelt", label: "seatbeltCheck", required: true },
        { id: "mirrors", label: "mirrorsCheck", required: true },
        { id: "horn", label: "hornCheck", required: true },
        { id: "emergencyKit", label: "emergencyKitCheck", required: true },
        { id: "fireExtinguisher", label: "fireExtinguisherCheck", required: true }
      ]
    },
    {
      section: "truckEngine",
      title: "truckEngineTitle",
      items: [
        { id: "oilLevel", label: "oilLevelCheck", required: true },
        { id: "coolantLevel", label: "coolantLevelCheck", required: true },
        { id: "brakeFluid", label: "brakeFluidCheck", required: true },
        { id: "powerSteering", label: "powerSteeringCheck", required: true },
        { id: "belts", label: "beltsCheck", required: true }
      ]
    },
    {
      section: "truckTiresBrakes",
      title: "truckTiresBrakesTitle",
      items: [
        { id: "tirePressure", label: "tirePressureCheck", required: true },
        { id: "treadDepth", label: "treadDepthCheck", required: true },
        { id: "brakePads", label: "brakePadsCheck", required: true },
        { id: "brakeLines", label: "brakeLinesCheck", required: true },
        { id: "spareTire", label: "spareTireCheck", required: true }
      ]
    },
    {
      section: "truckLights",
      title: "truckLightsTitle",
      items: [
        { id: "headlights", label: "headlightsCheck", required: true },
        { id: "taillights", label: "taillightsCheck", required: true },
        { id: "turnSignals", label: "turnSignalsCheck", required: true },
        { id: "hazardLights", label: "hazardLightsCheck", required: true },
        { id: "interiorLights", label: "interiorLightsCheck", required: true }
      ]
    }
  ],
  "Forklift": [
    {
      section: "forkliftSafety",
      title: "forkliftSafetyTitle",
      items: [
        { id: "operatorManual", label: "operatorManualCheck", required: true },
        { id: "loadChart", label: "loadChartCheck", required: true },
        { id: "safetyBelt", label: "safetyBeltCheck", required: true },
        { id: "horn", label: "hornCheck", required: true },
        { id: "backupAlarm", label: "backupAlarmCheck", required: true }
      ]
    },
    {
      section: "forkliftHydraulics",
      title: "forkliftHydraulicsTitle",
      items: [
        { id: "hydraulicFluid", label: "hydraulicFluidCheck", required: true },
        { id: "hoses", label: "hosesCheck", required: true },
        { id: "cylinders", label: "cylindersCheck", required: true },
        { id: "mastChains", label: "mastChainsCheck", required: true },
        { id: "liftCapacity", label: "liftCapacityCheck", required: true }
      ]
    },
    {
      section: "forkliftMechanical",
      title: "forkliftMechanicalTitle",
      items: [
        { id: "engineOil", label: "engineOilCheck", required: true },
        { id: "coolant", label: "coolantCheck", required: true },
        { id: "filters", label: "filtersCheck", required: true },
        { id: "battery", label: "batteryCheck", required: true },
        { id: "tires", label: "tiresCheck", required: true }
      ]
    },
    {
      section: "forkliftOperation",
      title: "forkliftOperationTitle",
      items: [
        { id: "steering", label: "steeringCheck", required: true },
        { id: "brakes", label: "brakesCheck", required: true },
        { id: "controls", label: "controlsCheck", required: true },
        { id: "mastMovement", label: "mastMovementCheck", required: true },
        { id: "forks", label: "forksCheck", required: true }
      ]
    }
  ],
  "Crane": [
    {
      section: "craneSafety",
      title: "craneSafetyTitle",
      items: [
        { id: "certification", label: "certificationCheck", required: true },
        { id: "loadChartVisible", label: "loadChartVisibleCheck", required: true },
        { id: "safetyGear", label: "safetyGearCheck", required: true },
        { id: "communication", label: "communicationCheck", required: true },
        { id: "workArea", label: "workAreaCheck", required: true }
      ]
    },
    {
      section: "craneStructure",
      title: "craneStructureTitle",
      items: [
        { id: "boom", label: "boomCheck", required: true },
        { id: "outriggers", label: "outriggersCheck", required: true },
        { id: "counterweights", label: "counterweightsCheck", required: true },
        { id: "pinsConnections", label: "pinsConnectionsCheck", required: true },
        { id: "welds", label: "weldsCheck", required: true }
      ]
    },
    {
      section: "craneMechanical",
      title: "craneMechanicalTitle",
      items: [
        { id: "hydraulicSystem", label: "hydraulicSystemCheck", required: true },
        { id: "wireRope", label: "wireRopeCheck", required: true },
        { id: "hooks", label: "hooksCheck", required: true },
        { id: "limitSwitches", label: "limitSwitchesCheck", required: true },
        { id: "brakeSystem", label: "brakeSystemCheck", required: true }
      ]
    },
    {
      section: "craneOperation",
      title: "craneOperationTitle",
      items: [
        { id: "controlsFunction", label: "controlsFunctionCheck", required: true },
        { id: "rotation", label: "rotationCheck", required: true },
        { id: "hoist", label: "hoistCheck", required: true },
        { id: "telescope", label: "telescopeCheck", required: true },
        { id: "emergencyStop", label: "emergencyStopCheck", required: true }
      ]
    }
  ]
};

// Export utility functions
export const getChecklistTemplate = (equipmentType) => {
  return CHECKLIST_TEMPLATES[equipmentType] || [];
};

export const getAllEquipmentTypes = () => {
  return Object.keys(CHECKLIST_TEMPLATES);
};
