Hooks.once("init", async () => {
    await loadTemplates([
        "modules/cod-alt-sheet/templates/parts/base-attributes.hbs",
        "modules/cod-alt-sheet/templates/parts/base-inventory.hbs",
        "modules/cod-alt-sheet/templates/parts/vamp-disciplines.hbs"
    ])

    Handlebars.registerHelper("dotState", function(base, final, dot) {
        if(final < base) {
            if(dot <= final) return "filled";
            if(dot <= base) return "penalty";
            return "empty";
        }

        if(dot <= base) return "filled";
        if(dot <= final) return "bonus";
        return "empty";
    });

    function render10Dots(base, final) {
        let html = "";
        for (let i = 1; i <= 10; i++) {
            let cls = "empty";
            if (final < base) {
                if (i <= final) cls = "filled";
                else if (i <= base) cls = "penalty";
            } else {
                if (i <= base) cls = "filled";
                else if (i <= Math.min(final, 10)) cls = "bonus";
            }
            const overflow = final > 10 && i <= (final - 10);
            if (i === 6) {
                html += `<span class="dot-gap"></span>`;
            }
            html += `
            <span class="dot ${cls}"
                data-value="${i}">
                ${overflow ? `<span class="overflow-dot"></span>` : ""}
            </span>`;
        }
        return html;
    }

    function render5Dots(base, final) {
        let html = "";
        for (let i = 1; i <= 5; i++) {
            let cls = "empty";
            if (final < base) {
                if (i <= final) cls = "filled";
                else if (i <= base) cls = "penalty";
            } else {
                if (i <= base) cls = "filled";
                else if (i <= Math.min(final, 5)) cls = "bonus";
            }
            const overflow = final > 5 && i <= (final - 5);
            html += `
            <span class="dot ${cls}"
                data-value="${i}">
                ${overflow ? `<span class="overflow-dot"></span>` : ""}
            </span>`;
        }
        return html;
    }

    function resolveTrait(actor, args) {
        console.log(actor, args);
        args.pop();
        const traitName = args.join('.');
        const trait = traitName.split('.').reduce((o, i) => {
        if ((o != undefined)) return o[i];
        else return undefined;
        }, actor.system);

        return { traitName, trait }
    }

    Handlebars.registerHelper('onlyDots', function(value, final) {
        return new Handlebars.SafeString(render5Dots(value, final));
    });

    Handlebars.registerHelper('renderPotency', function(value) {
        value = Number(value?.value ?? value ?? 0);
        return new Handlebars.SafeString(render10Dots(value, value));
    });

    Handlebars.registerHelper('rollableDots', function (actor, ...args) {
        let { traitName, trait } = resolveTrait(actor, args);

        if (trait === null) trait = 0;

        if (trait == undefined) {
        console.error("Failed to construct input", traitName)
        return;
        }

        const isAttribute = traitName.split('.')[0] === "attributes_mental" || traitName.split('.')[0] === "attributes_physical" || traitName.split('.')[0] === "attributes_social";
        const isSkill = traitName.split('.')[0] === "skills_physical" || traitName.split('.')[0] === "skills_social" || traitName.split('.')[0] === "skills_mental";
        const canBeRoteSkill = (actor.system.characterVariant === "mage" || actor.system.characterVariant === "scelesti") && isSkill; // FIXME: or scelesti, etc.

        const isArcanum = traitName.split('.')[0] === "arcana_subtle" || traitName.split('.')[0] === "arcana_gross";
        const isRenown = traitName.split('.')[0] === "werewolf_renown";
        const isPillar = traitName.split('.')[0] == "mummy_pillars";
        let traitPoints;
        if (isPillar) {
        traitPoints = trait.points && Number.isInteger(trait.points) ? trait.points: 0;
        }
        const isHaunt = traitName.split('.')[0] === "haunts";
        const moreDots = actor.getFlag("cod-alt-sheet", "moreDots") ?? false;

        const isInteger = Number.isInteger(trait);
        let traitValue = isInteger ? trait : trait.value;
        if (traitValue == undefined) traitValue = 0;
        const localisedName = game.i18n.localize("MTA." + traitName);
        
        const dotHtml = ((moreDots && (isAttribute || isSkill)) || traitName.split('.')[1] === "bloodPotency") ? render10Dots(traitValue, trait.final) : render5Dots(traitValue, trait.final);
        return `
        <li class="attribute flexrow rollableInput">
            <span>
                ${canBeRoteSkill ? `
                <label class="checkBox">
                <input data-dtype="Boolean" name="system.${traitName}.isRote" type="checkbox" ${trait.isRote ? 'checked' : ''}>
                <span></span>
                </label>` : ''}
                ${isArcanum ? `
                <span class="button arcana-state ${trait.isRuling ? 'ruling' : trait.isInferior ? 'inferior' : ''}" title="${trait.isRuling ? game.i18n.localize('MTA.RulingArcanum') : trait.isInferior ? game.i18n.localize('MTA.InferiorArcanum') : ""}" data-trait="${traitName}">${trait.isRuling ? game.i18n.localize('MTA.RulingShort') : trait.isInferior ? game.i18n.localize('MTA.InferiorShort') : ""}</span>
                ` : ''}
                ${isRenown ? `
                <span class="button renown-state ${trait.isAuspice ? 'auspice' : trait.isTribe ? 'tribe' : ''}" title="${trait.isAuspice ? game.i18n.localize('MTA.Auspice') : trait.isTribe ? game.i18n.localize('MTA.Tribe') : ''}" data-trait="${traitName}">${trait.isAuspice ? game.i18n.localize('MTA.AuspiceShort') : trait.isTribe ? game.i18n.localize('MTA.TribeShort') : ''}</span>
                ` : ''}
                ${isHaunt ? `
                <span class="button haunt-state ${trait.hasAffinity ? 'affinity' : ''}" title="${trait.hasAffinity ? game.i18n.localize('MTA.HauntAffinity') : ''}" data-trait="${traitName}"></span>
                ` : ''}
                ${isPillar ? `
                <span class="button pillar-state ${trait.isPrimary ? 'primary' : ''}" title="${trait.isPrimary ? game.i18n.localize('MTA.Mummy.primaryPillar') : ''}" data-trait="${traitName}"></span>
                ` : ''}
                ${isSkill ? `
                <span class="button skill-specialty tooltip ${trait.specialties?.length ? 'available' : ''} ${trait.isAssetSkill ? 'asset' : ''}" data-trait="${traitName}"><i class="fa-solid fa-diamond"></i>
                ${trait.specialties?.length ? `
                    <span class="tooltip-text">
                    <ul>
                        ${trait.specialties.reduce((prev, cur) => prev + `<li>${cur}</li>`, '')}
                    </ul>
                    </span>
                `: ''}
                </span>` : ''}
                <span>
                    <input class="attribute-check" id="${actor._id + traitName}" data-trait="${traitName}" type="checkbox" data-dtype="Boolean">
                    <label class="button attribute-button" for="${actor._id + traitName}">${localisedName}</label>
                </span>
            </span>
            <span>
                ${isPillar ? `
                <span>
                    <input class="attribute-value" type="number" name="system.${isInteger ? traitName : traitName + ".points"}" value=${traitPoints} data-dtype="Number" min=0 max=999>
                </span>
                ` : ''}
                <div class="dots"
                    data-path="system.${isInteger ? traitName : traitName + ".value"}">
                    ${dotHtml}
                </div>
            </span>
    </li>`
    });

    Handlebars.registerHelper('coverageList', function(coverage) {
        let coverageString = "";
        for(const [area, covered] of Object.entries(coverage)) {
            if(covered) {
                coverageString += (area + ", ")
            }
        }
        coverageString = coverageString.slice(0, -2);
        return coverageString;
    });
});

//${isAttribute ? render10Dots(traitValue, trait.final) : (isSkill ? render10Dots(traitValue, trait.final) : render5Dots(traitValue, trait.final))}

Hooks.once("ready", () => {

    const armorSheets = Object.values(CONFIG.Item.sheetClasses.armor);
    const baseArmor = armorSheets.find(s => s.default)?.cls ?? armorSheets[0]?.cls;
    if(!baseArmor) {
        console.error("Base armor sheet not found");
        return;
    }

    class AltArmorSheet extends baseArmor {
        get template() {
            return "modules/cod-alt-sheet/templates/items/armor.html";
        }
    }

    Items.registerSheet(
        "cod-alt-sheet",
        AltArmorSheet,
        {
        types: ["armor"],
        makeDefault: false,
        label: "Alt Armor Sheet"
        }
    );

    const sheets = Object.values(CONFIG.Actor.sheetClasses.character);
    const baseSheet = sheets[0]?.cls;

    class AltSheet extends baseSheet {

        /*
        static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "modules/cod-alt-sheet/templates/character.html"
        });
        }
        */

        get template() {
            return "modules/cod-alt-sheet/templates/character.html";
        }

        activateListeners(html) {
            super.activateListeners(html);
            html.find(".dot").click(async ev => {
                const dot = ev.currentTarget;
                let value = Number(dot.dataset.value);
                const path = dot.closest(".dots").dataset.path;
                const current = foundry.utils.getProperty(this.actor, path);
                if(value === 1 && current === 1) {
                    value = 0;
                }
                await this.actor.update({
                    [path]: value
                });
            });

            html.find(".armor-toggle").click(async ev => {
                ev.preventDefault();
                const expanded = this.actor.getFlag("cod-alt-sheet", "armorExpanded") || false;
                await this.actor.setFlag("cod-alt-sheet", "armorExpanded", !expanded);
            });

            html.find(".toggleDots").click(async () => {
                const moreDots = this.actor.getFlag("cod-alt-sheet", "moreDots") ?? false;
                await this.actor.setFlag("cod-alt-sheet", "moreDots", !moreDots);
            })
        }

        async getData() {
            const data = await super.getData();

            const armorData = {
                torso: {rating: 0, ballistic: 0},
                arms: {rating: 0, ballistic: 0},
                legs: {rating: 0, ballistic: 0},
                head: {rating: 0, ballistic: 0},
                eyes: {rating: 0, ballistic: 0},
                ears: {rating: 0, ballistic: 0},
                neck: {rating: 0, ballistic: 0},
                hands: {rating: 0, ballistic: 0},
                feet: {rating: 0, ballistic: 0}
            }

            const armorItems = this.actor.items.filter(i => {
                return i.type === "armor" && i.system.equipped;
            });

            for(const item of armorItems) {
                const rating = Number(item.system.rating) || 0;
                const ballistic = Number(item.system.ballistic) || 0;
                const coverage = item.system.coverage || {};
                for(const [area, covered] of Object.entries(coverage)) {
                    if(!covered) continue;
                    armorData[area].rating = Math.max(armorData[area].rating, rating);
                    armorData[area].ballistic = Math.max(armorData[area].ballistic, ballistic);
                }
            }

            data.armorData = armorData;
            data.armorSummary = {
                rating: armorData.torso.rating, ballistic: armorData.torso.ballistic
            };
            data.armorExpanded = this.actor.getFlag("cod-alt-sheet", "armorExpanded") || false;

            return data;
        }

    }

    Actors.registerSheet(
        "cod-alt-sheet",
        AltSheet,
        {
        types: ["character"],
        makeDefault: false,
        label: "Alt Character Sheet"
        }
    );
});