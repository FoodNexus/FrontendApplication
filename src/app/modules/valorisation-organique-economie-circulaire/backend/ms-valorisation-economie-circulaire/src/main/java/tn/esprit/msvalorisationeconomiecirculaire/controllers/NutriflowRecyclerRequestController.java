package tn.esprit.msvalorisationeconomiecirculaire.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import tn.esprit.msvalorisationeconomiecirculaire.dto.RecyclerRequestDTO;
import tn.esprit.msvalorisationeconomiecirculaire.services.NutriflowHubStateService;

@RestController
@RequestMapping("/api/nutriflow/recycler-requests")
@RequiredArgsConstructor
public class NutriflowRecyclerRequestController {

    private final NutriflowHubStateService state;

    @GetMapping
    public ResponseEntity<List<RecyclerRequestDTO>> getAll() {
        return ResponseEntity.ok(state.getRecyclerRequests());
    }

    @PutMapping
    public ResponseEntity<Void> replaceAll(@RequestBody List<RecyclerRequestDTO> body) {
        state.replaceRecyclerRequests(body != null ? body : List.of());
        return ResponseEntity.noContent().build();
    }
}
