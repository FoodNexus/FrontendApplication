package tn.esprit.msvalorisationeconomiecirculaire.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class NutriflowCreditsPayloadDTO {

    private List<CreditLedgerEntryDTO> ledger = new ArrayList<>();
}
