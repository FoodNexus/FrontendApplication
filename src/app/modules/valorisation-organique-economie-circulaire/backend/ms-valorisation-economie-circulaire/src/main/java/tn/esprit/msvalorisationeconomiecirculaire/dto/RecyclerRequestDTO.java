package tn.esprit.msvalorisationeconomiecirculaire.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecyclerRequestDTO {

    private Long id;
    private Long productId;
    private String productName;
    private Double quantityKg;
    private String note;
    private RequestStatus status;
    private Instant requestedAt;
    private String donorUserKey;
    private Long donorLotId;
    private String lotCode;
    private String treatmentPlan;
    private String pickupWindow;
    private String managerComment;
    private String recyclerUserKey;
    private String verificationSubmittedAt;
    private String adminVerificationComment;
    private String verifiedAt;
}
