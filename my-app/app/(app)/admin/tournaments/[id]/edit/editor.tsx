"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicsTab } from "./tabs/basics-tab";
import { RulesTab } from "./tabs/rules-tab";
import { RegistrationTab } from "./tabs/registration-tab";
import { PaymentTab } from "./tabs/payment-tab";
import { PrizeTab } from "./tabs/prize-tab";
import { StructureTab } from "./tabs/structure-tab";
import { PublishTab } from "./tabs/publish-tab";
import type { ComponentProps } from "react";

export function TournamentEditor({
  tournamentId,
  basicsDefaults,
  rulesDefaults,
  registrationDefaults,
  paymentDefaults,
  prizeDefaults,
  structureDefaults,
  fighters,
  mode,
  slug,
  status,
  displayStatus,
}: {
  tournamentId: string;
  basicsDefaults: ComponentProps<typeof BasicsTab>["defaults"];
  rulesDefaults: ComponentProps<typeof RulesTab>["defaults"];
  registrationDefaults: ComponentProps<typeof RegistrationTab>["defaults"];
  paymentDefaults: ComponentProps<typeof PaymentTab>["defaults"];
  prizeDefaults: ComponentProps<typeof PrizeTab>["defaults"];
  structureDefaults: ComponentProps<typeof StructureTab>["defaults"];
  fighters: ComponentProps<typeof RulesTab>["fighters"];
  mode: "ONE_V_ONE" | "THREE_V_THREE";
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  displayStatus: ComponentProps<typeof PublishTab>["displayStatus"];
}) {
  return (
    <Tabs defaultValue="basics">
      <TabsList className="mb-6 flex-wrap">
        <TabsTrigger value="basics">Basics</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="registration">Registration</TabsTrigger>
        <TabsTrigger value="payment">Payment</TabsTrigger>
        <TabsTrigger value="prize">Prize pool</TabsTrigger>
        <TabsTrigger value="structure">Structure</TabsTrigger>
        <TabsTrigger value="publish">Review &amp; publish</TabsTrigger>
      </TabsList>
      <TabsContent value="basics">
        <BasicsTab tournamentId={tournamentId} defaults={basicsDefaults} />
      </TabsContent>
      <TabsContent value="rules">
        <RulesTab tournamentId={tournamentId} mode={mode} defaults={rulesDefaults} fighters={fighters} />
      </TabsContent>
      <TabsContent value="registration">
        <RegistrationTab tournamentId={tournamentId} defaults={registrationDefaults} />
      </TabsContent>
      <TabsContent value="payment">
        <PaymentTab tournamentId={tournamentId} defaults={paymentDefaults} />
      </TabsContent>
      <TabsContent value="prize">
        <PrizeTab tournamentId={tournamentId} defaults={prizeDefaults} />
      </TabsContent>
      <TabsContent value="structure">
        <StructureTab tournamentId={tournamentId} defaults={structureDefaults} />
      </TabsContent>
      <TabsContent value="publish">
        <PublishTab tournamentId={tournamentId} slug={slug} status={status} displayStatus={displayStatus} />
      </TabsContent>
    </Tabs>
  );
}
