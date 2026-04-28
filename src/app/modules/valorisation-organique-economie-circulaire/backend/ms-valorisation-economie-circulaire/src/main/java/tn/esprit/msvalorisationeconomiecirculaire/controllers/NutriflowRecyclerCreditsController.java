package tn.esprit.msvalorisationeconomiecirculaire.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import tn.esprit.msvalorisationeconomiecirculaire.dto.NutriflowCreditsPayloadDTO;
import tn.esprit.msvalorisationeconomiecirculaire.services.NutriflowHubStateService;

@RestController
@RequestMapping("/api/nutriflow/recycler-credits")
@RequiredArgsConstructor
public class NutriflowRecyclerCreditsController {

    private final NutriflowHubStateService state;

    @GetMapping
    public ResponseEntity<NutriflowCreditsPayloadDTO> get() {
        return ResponseEntity.ok(state.getCredits());
    }

    @PutMapping
    public ResponseEntity<Void> replace(@RequestBody NutriflowCreditsPayloadDTO body) {
        state.replaceCredits(body != null ? body : new NutriflowCreditsPayloadDTO());
        return ResponseEntity.noContent().build();
    }
}
