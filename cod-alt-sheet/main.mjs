Hooks.once("init", function() {
    CONFIG.MTA.skills_physical.archery = "Archery";
    CONFIG.MTA.skills_social.ride = "Ride";
    CONFIG.MTA.skills_mental.enigmas = "Enigmas";

    delete CONFIG.MTA.EXTRA_BEAT_CONFIG.vampire;

    CONFIG.MTA.disciplines_common.auspex = "Auspex";
    delete CONFIG.MTA.disciplines_unique.auspex;
    CONFIG.MTA.disciplines_common.dominate = "Dominate";
    delete CONFIG.MTA.disciplines_unique.dominate;
    CONFIG.MTA.disciplines_common.majesty = "Majesty";
    delete CONFIG.MTA.disciplines_unique.majesty;
    CONFIG.MTA.disciplines_common.nightmare = "Nightmare";
    delete CONFIG.MTA.disciplines_unique.nightmare;
    CONFIG.MTA.disciplines_common.protean = "Protean";
    delete CONFIG.MTA.disciplines_unique.protean;
    CONFIG.MTA.disciplines_unique.cruac = "Crúac"
    delete CONFIG.MTA.disciplines_common.cruac;
})