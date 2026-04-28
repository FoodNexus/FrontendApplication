package tn.esprit.msvalorisationeconomiecirculaire.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import tn.esprit.msvalorisationeconomiecirculaire.dto.DonorLotDTO;
import tn.esprit.msvalorisationeconomiecirculaire.services.NutriflowHubStateService;

/**
 * Contrat consommé par le front Angular ({@code nutriflow-hub-sync.service.ts}).
 */
@RestController
@RequestMapping("/api/nutriflow/donor-lots")
@RequiredArgsConstructor
public class NutriflowDonorLotController {

    private final NutriflowHubStateService state;

    @GetMapping
    public ResponseEntity<List<DonorLotDTO>> getAll() {
        return ResponseEntity.ok(state.getDonorLots());
    }

    @PutMapping
    public ResponseEntity<Void> replaceAll(@RequestBody List<DonorLotDTO> body) {
        state.replaceDonorLots(body != null ? body : List.of());
        return ResponseEntity.noContent().build();
    }
}
