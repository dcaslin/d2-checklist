import { Injectable } from '@angular/core';
import { DestinyCacheService } from './destiny-cache.service';
import {
    Badge,
    BadgeClass,
    DestinyObjectiveUiStyle,
    ItemObjective,
    NameDesc,
    NameQuantity,
    PathEntry,
    Questline,
    QuestlineStep,
    Seal,
    SeasonalChallengeEntry,
    TriumphCollectibleNode,
    TriumphNode,
    TriumphPresentationNode,
    TriumphRecordNode
} from './model';
import { dynamicStringClear } from './parse-utils';

@Injectable({ providedIn: 'root' })
export class TriumphParserService {

    constructor(private destinyCacheService: DestinyCacheService) {
    }

    public getBestPres(aNodes: any[], key: string): any {
        let bestNode = null;
        for (const nodes of aNodes) {
            const v = nodes[key];
            if (v == null) { continue; }
            if (bestNode == null || v.progress > bestNode.progress) {
                bestNode = v;
            }
        }
        return bestNode;
    }

    public async handleRecPresNode(path: PathEntry[], key: string, pres: any[], records: any[], triumphLeaves: TriumphRecordNode[], showZeroPtTriumphs: boolean, showInvisTriumphs: boolean, extraRoots?: string[]): Promise<TriumphPresentationNode> {
        const val = this.getBestPres(pres, key);
        if (!val) {
            return null!;
        }
        const pDesc = await this.destinyCacheService.getPresentationNode(key);
        if (pDesc == null) {
            return null!;
        }
        path.push({
            path: pDesc.displayProperties.name,
            hash: key
        });
        const children = [];
        let unredeemedCount = 0;
        let pts = 0;
        let total = 0;
        let vaulted = 0;
        let vaultedIncomplete = 0;
        let vaultedComplete = 0;
        if (pDesc.children != null) {
            let presNodes = pDesc.children.presentationNodes.slice(0);
            let recNodes = pDesc.children.records.slice(0);
            if (extraRoots) {
                for (const extraRoot of extraRoots) {
                    const xrDesc = await this.destinyCacheService.getPresentationNode(extraRoot);
                    if (xrDesc == null) {
                        return null!;
                    }
                    presNodes = presNodes.concat(xrDesc.children.presentationNodes);
                    recNodes = presNodes.concat(xrDesc.children.records);
                }
            }


            for (const child of presNodes) {
                const oChild = await this.handleRecPresNode(path.slice(), child.presentationNodeHash, pres, records, triumphLeaves, showZeroPtTriumphs, showInvisTriumphs);
                if (oChild == null) { continue; }
                children.push(oChild);
                unredeemedCount += oChild.unredeemedCount;
                total += oChild.totalPts;
                pts += oChild.pts;
                vaulted += oChild!.vaultedChildren!;
                vaultedComplete += oChild!.vaultedChildrenComplete!;
                vaultedIncomplete += oChild!.vaultedChildrenIncomplete!;
            }
            for (const child of recNodes) {
                const oChild = await this.handleRecordNode(path.slice(), child.recordHash, records, showZeroPtTriumphs, showInvisTriumphs);
                if (oChild == null) { continue; }
                triumphLeaves.push(oChild);
                if (oChild.invisible && !showInvisTriumphs) { continue; }
                if (oChild.score == 0 && !showZeroPtTriumphs) { continue; }
                children.push(oChild);
                if (oChild.complete && !oChild.redeemed) {
                    unredeemedCount++;
                }
                pts += oChild.earned;                
                total += oChild.score;
            }
        }
        if (children == null || children.length == 0) {
            return null!;
        }
        children.sort(function (a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return {
            type: 'presentation',
            hash: key,
            name: pDesc.displayProperties.name,
            desc: pDesc.displayProperties.description,
            icon: pDesc.displayProperties.icon,
            index: pDesc.index,
            progress: val.objective == null ? 0 : val.objective.progress,
            completionValue: val.objective == null ? 1 : val.objective.completionValue,
            complete: val.objective == null ? false : val.objective.complete,
            children: children,
            path: path,
            unredeemedCount: unredeemedCount,
            pts: pts,
            totalPts: total,
            vaultedChildren: vaulted,
            vaultedChildrenComplete: vaultedComplete,
            vaultedChildrenIncomplete: vaultedIncomplete,
        };
    }


    private async handleRecordNode(path: PathEntry[], key: string, records: any[], showZeroPtTriumphs: boolean, showInvisTriumphs: boolean): Promise<TriumphRecordNode> {
        const rDesc = await this.destinyCacheService.getRecord(key);
        if (rDesc == null) { return null!; }        
        let pointsToBadge = false;
        if (rDesc.displayProperties != null && rDesc.displayProperties.description != null) {
            if (rDesc.displayProperties.description.indexOf('Complete the associated badge') == 0) {
                pointsToBadge = true;
            }
        }
        if (key == '52802522') {
            pointsToBadge = true;
        }

        const val = this.getBestRec(records, key);
        if (val == null) { return null!; }

        path.push({
            path: rDesc.displayProperties.name,
            hash: key
        });


        let searchText = rDesc.displayProperties.name + ' ' + rDesc.displayProperties.description;

        let isInterval = false;
        let iterateMe = val.objectives;
        let intervalsRedeemedCount = null;
        if (!val.objectives && val.intervalObjectives) {
            isInterval = true;
            iterateMe = val.intervalObjectives;
            intervalsRedeemedCount = val.intervalsRedeemedCount;
            searchText += ' interval';
        }
        if (!iterateMe) {
            return null!;
        }
        let objs: ItemObjective[] = [];
        let totalProgress = 0;
        let earnedPts = 0;
        let totalPts = 0;
        if (rDesc.completionInfo && rDesc.completionInfo.ScoreValue) {
            totalPts = rDesc.completionInfo.ScoreValue;
        } else if (rDesc.intervalInfo && rDesc.intervalInfo.intervalObjectives) {
            let intervalIndex = 0;
            for (const intervalObj of rDesc.intervalInfo.intervalObjectives) {
                if (intervalObj.intervalScoreValue) {
                    totalPts += intervalObj.intervalScoreValue;
                }
                if (val.intervalObjectives.length > intervalIndex) {
                    const intervalVal = val.intervalObjectives[intervalIndex];
                    if (intervalVal.complete) {
                        earnedPts += intervalObj.intervalScoreValue;
                    }
                }
                // if (val.)
                intervalIndex++;
            }

        }


        let objIndex = -1;
        let incompIntPercent = null;
        let percentToNextInterval = null;
        for (const o of iterateMe) {
            objIndex++;
            const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
            if (oDesc == null) { continue; }

            let score = null;
            if (isInterval && rDesc?.intervalInfo?.intervalObjectives && objIndex < rDesc.intervalInfo.intervalObjectives.length) {
                score = rDesc.intervalInfo.intervalObjectives[objIndex].intervalScoreValue;
            }

            const iObj: ItemObjective = {
                hash: o.objectiveHash,
                completionValue: o.completionValue ? o.completionValue : oDesc.completionValue,
                progressDescription: oDesc.progressDescription,
                progress: o.progress == null ? 0 : o.progress,
                complete: o.complete,
                score: score,
                percent: 0
            };
            if (iObj.complete && iObj.progress < 1) {
                iObj.progress = oDesc.completionValue;
            }

            let max = iObj.completionValue;
            if (iObj.completionValue == null || iObj.completionValue <= 0) {
                max = 1;
            }
            let objPercent = 100 * iObj.progress / max;
            if (objPercent > 100) { objPercent = 100; }
            iObj.percent = Math.floor(objPercent);

            totalProgress += oDesc.completionValue;
            objs.push(iObj);
            incompIntPercent = iObj.percent;
            if (percentToNextInterval == null && !o.complete) {
                percentToNextInterval = iObj.percent;
            }
        }
        if (totalProgress < 2) { objs = []; }
        let complete = false;
        let redeemed = false;
        let title = false;
        let invisible = false;
        if (val != null && val.state != null) {
            if (val.state === 0) {
                complete = true;
            }
            if ((val.state & 1) > 0) {
                redeemed = true;
                complete = true;
            }
            if ((val.state & 16) > 0) {
                invisible = true;
            }
            if ((val.state & 64) > 0) {
                title = true;
            }
        }

        let percent = 0;
        if (objs.length > 0) {
            let sum = 0;
            for (const o of objs) {
                sum += o.percent;
                searchText += ' ' + o.progressDescription;
            }
            percent = Math.floor(sum / objs.length);
        }
        // interval or not, if it's done they got all the points
        if (complete) {
            earnedPts = totalPts;
        }

        const rewardValues: NameQuantity[] = [];
        if (rDesc.rewardItems) {
            let hasReward = false;
            for (const ri of rDesc.rewardItems) {
                if (ri.itemHash === 0) { continue; }
                const valDesc: any = await this.destinyCacheService.getInventoryItem(ri.itemHash);
                if (valDesc != null) {

                    searchText += ' ' + valDesc.displayProperties.name;

                    rewardValues.push({
                        hash: ri.itemHash,
                        name: valDesc.displayProperties.name,
                        quantity: ri.quantity,
                        icon: valDesc.displayProperties.icon,
                        itemTypeDisplayName: valDesc.itemTypeDisplayName?.trim().length > 0 ? valDesc.itemTypeDisplayName : null
                    });
                    if (valDesc.itemTypeDisplayName?.trim().length > 0) {
                        searchText += ' has:' + valDesc.itemTypeDisplayName.toLowerCase();
                    }
                    hasReward = true;
                }
            }
            if (hasReward) {
                searchText += ' has:reward';
            }
        }
        // if this is involved in a title and the state is complete, respect it, even if there are other intervals
        if (!title && incompIntPercent != null && incompIntPercent < 100) {
            complete = false;
        }
        return {
            type: 'record',
            hash: key,
            name: rDesc.displayProperties.name,
            desc: rDesc.displayProperties.description,
            icon: rDesc.displayProperties.icon,
            index: rDesc.index,
            objectives: objs,
            intervalsRedeemedCount: intervalsRedeemedCount,
            complete: complete,
            redeemed: redeemed,
            forTitleGilding: rDesc.forTitleGilding,
            title: title,
            children: null!,
            path: path,
            interval: isInterval,
            earned: earnedPts,
            score: totalPts,
            percentToNextInterval: complete ? 100 : percentToNextInterval ? percentToNextInterval : percent,
            percent: complete ? 100 : incompIntPercent ? incompIntPercent : percent,
            searchText: searchText.toLowerCase(),
            invisible: invisible,
            pointsToBadge: pointsToBadge,
            rewardItems: rewardValues
        };
    }


    private getBestRec(aNodes: any[], key: string): any {
        let bestNode = null;
        for (const nodes of aNodes) {
            const v = nodes[key];
            if (v == null) { continue; }
            if (bestNode == null || this.recAvg(v) > this.recAvg(bestNode)) {
                bestNode = v;
            }
        }
        return bestNode;
    }


    private getBestCol(aNodes: any[], key: string): any {
        let bestNode = null;
        for (const nodes of aNodes) {
            const v = nodes[key];
            if (v == null) { continue; }
            if (bestNode == null || (v.state != null && (v.state & 1) === 0)) {
                bestNode = v;
            }
        }
        return bestNode;
    }


    public async handleColPresNode(path: PathEntry[], key: string, pres: any[], collectibles: any[], collLeaves: TriumphCollectibleNode[]): Promise<TriumphPresentationNode> {
        const val = this.getBestPres(pres, key);
        if (val == null) {
            return null!;
        }
        const pDesc = await this.destinyCacheService.getPresentationNode(key);
        if (pDesc == null) { return null!; }
        path.push({
            path: pDesc.displayProperties.name,
            hash: key
        });
        const children = [];
        if (pDesc.children != null) {
            for (const child of pDesc.children.presentationNodes) {
                const oChild = await this.handleColPresNode(path.slice(0), child.presentationNodeHash, pres, collectibles, collLeaves);
                if (oChild == null) { continue; }
                children.push(oChild);
            }
            for (const child of pDesc.children.collectibles) {
                const oChild = await this.handleCollectibleNode(path.slice(0), child.collectibleHash, collectibles);
                if (oChild != null) {
                    children.push(oChild);
                    collLeaves.push(oChild);
                }
            }
        }
        children.sort(function (a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return {
            type: 'presentation',
            hash: key,
            name: pDesc.displayProperties.name,
            desc: pDesc.displayProperties.description,
            icon: pDesc.displayProperties.icon,
            index: pDesc.index,
            progress: val.objective == null ? 0 : val.objective.progress,
            completionValue: val.objective == null ? 1 : val.objective.completionValue,
            complete: val.objective == null ? false : val.objective.complete,
            children: children,
            path: path,
            unredeemedCount: 0,
            pts: 0,
            totalPts: 0
        };
    }


    private recAvg(rec: any): number {
        if (rec.objectives == null) { return 0; }
        let sum = 0;
        for (const o of rec.objectives) {
            if (o.completionValue != null && o.completionValue > 0) {
                sum += o.progress / o.completionValue;
            }
        }
        return sum;
    }


    private async handleCollectibleNode(path: PathEntry[], key: string, collectibles: any[]): Promise<TriumphCollectibleNode> {
        const cDesc = await this.destinyCacheService.getCollectible(key);
        if (cDesc == null) { return null!; }
        const val = this.getBestCol(collectibles, key);
        if (val != null && val.state != null && (val.state & 4) > 0) {
            return null!;
        }
        path.push({
            path: cDesc.displayProperties.name,
            hash: key
        });

        let acquired = false;
        if (val != null && val.state != null && (val.state & 1) === 0) {
            acquired = true;
        }
        return {
            type: 'collectible',
            hash: key,
            name: cDesc.displayProperties.name,
            desc: cDesc.displayProperties.description,
            icon: cDesc.displayProperties.icon,
            index: cDesc.index,
            acquired: acquired,
            complete: acquired,
            sourceString: cDesc.sourceString,
            searchText: cDesc.displayProperties.name.toLowerCase(),
            children: null!,
            path: path
        };
    }


    private async parseQuestStep(stepHash: number, currentStepHash: number): Promise<QuestlineStep> {
        const desc: any = await this.destinyCacheService.getInventoryItem(stepHash);
        if (desc == null) { return null!; }
        const values = [];
        if (desc.value != null && desc.value.itemValue != null) {
            for (const val of desc.value.itemValue) {
                if (val.itemHash === 0) { continue; }
                const valDesc: any = await this.destinyCacheService.getInventoryItem(val.itemHash);
                if (valDesc != null) {
                    values.push({
                        hash: valDesc.hash,
                        icon: valDesc.displayProperties.icon,
                        name: valDesc.displayProperties.name,
                        quantity: val.quantity
                    });
                }
            }
        }
        const objectives = [];
        if (desc.objectives != null && desc.objectives.objectiveHashes != null) {
            for (const objectiveHash of desc.objectives.objectiveHashes) {
                const oDesc = await this.destinyCacheService.getObjective(objectiveHash);
                const iObj: ItemObjective = {
                    hash: objectiveHash,
                    completionValue: oDesc.completionValue,
                    progressDescription: oDesc.progressDescription,
                    progress: 0,
                    complete: false,
                    percent: 0
                };
                objectives.push(iObj);
            }
        }
        return {
            hash: stepHash,
            name: desc.displayProperties.name,
            desc: desc.displayProperties.description,
            objectives: objectives,
            values: values,
            current: currentStepHash == stepHash
        };
    }

    public async parseQuestLine(qli: number, stepHash: number): Promise<Questline> {
        const qdesc: any = await this.destinyCacheService.getInventoryItem(qli);
        if (qdesc == null) { return null!; }
        // if (qdesc.setData != null) { }
        if (qdesc.setData == null) { return null!; }
        // wtf was this doing anyway?
        const qType = qdesc.setData.setType;
        // this is a milestone, don't show it here

        if ('challenge' == qType) {
            let skip = true;
            if (qdesc.displayProperties && qdesc.displayProperties.name) {
                const name = qdesc.displayProperties.name;
                // 2743269252 and 314306447 respectively
                // check by name so that other quests aren't filtered out in pursuits
                // these 2 challenges are special in that they're basically milestones but
                // only show up in the inv as challenges
                if (name == 'Dark Times' || name == 'Luna\'s Calling' || name == 'Nightmare Slayer') {
                    skip = false;
                }
            }
            if (skip) {
                return null!;
            }
        }
        const steps = qdesc.setData.itemList;
        let cntr = 0;
        const oSteps = [];
        let progress = '';
        for (const step of steps) {
            cntr++;
            const oStep = await this.parseQuestStep(step.itemHash, stepHash);
            if (oStep != null) {
                oSteps.push(oStep);
                if (oStep.current) {
                    progress = cntr + '/' + steps.length;
                }
            }

        }
        return {
            hash: qdesc.hash,
            name: qdesc.displayProperties.name,
            steps: oSteps,
            progress: progress
        };
    }

    public async buildBadge(node: TriumphNode): Promise<Badge> {
        const pDesc = await this.destinyCacheService.getPresentationNode(node.hash);
        if (pDesc == null) { return null!; }
        const badgeClasses: BadgeClass[] = [];
        let badgeComplete = false;
        let bestProgress = 0;
        let total = 0;
        for (const c of node.children) {
            let complete = 0;
            for (const coll of c.children) {
                const co = coll as TriumphCollectibleNode;
                if (co.acquired) {
                    complete++;
                }
            }
            if (complete > bestProgress) {
                bestProgress = complete;
                total = c.children.length;
            }
            badgeClasses.push({
                hash: c.hash,
                name: c.name,
                complete: complete,
                total: c.children.length,
                children: c.children as TriumphCollectibleNode[]
            });
            badgeComplete = badgeComplete || complete === c.children.length;
        }
        return {
            hash: node.hash,
            name: node.name,
            desc: node.desc,
            icon: node.icon,
            complete: badgeComplete,
            bestProgress: bestProgress,
            total: total,
            percent: 100 * bestProgress / (total ? total : 1),
            classes: badgeClasses
        };
    }


    public async buildSeal(node: TriumphNode, badges: Badge[]): Promise<Seal> {
        const pDesc = await this.destinyCacheService.getPresentationNode(node.hash);
        if (pDesc == null) { return null!; }
        const completionRecordHash = pDesc.completionRecordHash;
        const cDesc = await this.destinyCacheService.getRecord(completionRecordHash);
        if (cDesc == null) { return null!; }
        let title = 'Secret';
        if (cDesc.titleInfo != null) {
            title = cDesc.titleInfo.titlesByGenderHash[2204441813];
        }
        let progress = 0;
        let gildTotal = 0;
        let gildProgress = 0;
        for (const c of node.children) {
            const gilded = (c as TriumphRecordNode).forTitleGilding;
            if (c.complete && !gilded) {
                progress++;
            }
            if (gilded) {
                gildTotal++;
                if (c.complete) {
                    gildProgress++;
                }
            }
            const trn = c as TriumphRecordNode;
            if (trn.pointsToBadge === true) {
                for (const b of badges) {
                    if (b.name === trn.name) {
                        trn.badge = b;
                    } else if (trn.hash == '52802522' && b.hash == '2759158924') {
                        trn.badge = b;
                    }
                }
            }
        }
        let completeValue = node.children.length;
        if (cDesc.objectiveHashes && cDesc.objectiveHashes.length == 1) {
            const oDesc = await this.destinyCacheService.getObjective(cDesc.objectiveHashes[0]);
            if (oDesc && oDesc.completionValue) {
                // MMXIX shows 25 even though there are only 24
                if (oDesc.completionValue < completeValue) {
                    completeValue = oDesc.completionValue;
                }
            }
        }

        const percent = Math.floor((100 * progress) / completeValue);
        return {
            hash: node.hash,
            name: node.name,
            desc: node.desc,
            icon: node.icon,
            children: node.children,
            title: title,
            percent: percent,
            progress: progress,
            complete: progress >= completeValue,
            gildTotal,
            gildProgress,
            completionValue: completeValue
        };
    }


    public findLeaves(triumphs: TriumphRecordNode[], hashes: number[]): TriumphRecordNode[] {        
        const returnMe: TriumphRecordNode[] = [];
        for (const t of triumphs) {            
            for (const p of t.path) {
                if (hashes.indexOf(+p.hash)>=0) {
                    returnMe.push(t);
                    break;
                }
            }
        }
        return returnMe;
    }
}
