package tn.esprit.msvalorisationeconomiecirculaire.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DonorLotDTO {

    private Long id;
    private String donorUserKey;
    private Long matchingLotId;
    private String name;
    private String category;
    private Double quantityKg;
    private String location;
    private String imageUrl;
    private DonorLotListingStatus listingStatus;
    private String classificationDescription;
    private java.util.List<String> classificationFilieres;
    private Double aiRecyclablePercent;
    private Double aiOrganicPercent;
}
