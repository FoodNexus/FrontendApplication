package tn.esprit.msvalorisationeconomiecirculaire.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CreditLedgerEntryDTO {

    private String id;
    private String userKey;
    private Long requestId;
    private Integer amount;
    private String createdAt;
    private String note;
}
