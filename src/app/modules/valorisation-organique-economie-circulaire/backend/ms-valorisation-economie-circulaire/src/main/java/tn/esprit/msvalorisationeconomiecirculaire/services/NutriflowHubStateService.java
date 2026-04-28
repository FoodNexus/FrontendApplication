package tn.esprit.msvalorisationeconomiecirculaire.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Service;

import tn.esprit.msvalorisationeconomiecirculaire.dto.CreditLedgerEntryDTO;
import tn.esprit.msvalorisationeconomiecirculaire.dto.DonorLotDTO;
import tn.esprit.msvalorisationeconomiecirculaire.dto.NutriflowCreditsPayloadDTO;
import tn.esprit.msvalorisationeconomiecirculaire.dto.RecyclerRequestDTO;

/**
 * État partagé du hub NutriFlow (mémoire, aligné avant JPA comme les autres modules).
 */
@Service
public class NutriflowHubStateService {

    private final CopyOnWriteArrayList<DonorLotDTO> donorLots = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<RecyclerRequestDTO> recyclerRequests = new CopyOnWriteArrayList<>();
    private final AtomicReference<NutriflowCreditsPayloadDTO> recyclerCredits =
        new AtomicReference<>(emptyCreditsPayload());

    public List<DonorLotDTO> getDonorLots() {
        return new ArrayList<>(donorLots);
    }

    public void replaceDonorLots(List<DonorLotDTO> next) {
        donorLots.clear();
        if (next != null && !next.isEmpty()) {
            donorLots.addAll(next);
        }
    }

    public List<RecyclerRequestDTO> getRecyclerRequests() {
        return new ArrayList<>(recyclerRequests);
    }

    public void replaceRecyclerRequests(List<RecyclerRequestDTO> next) {
        recyclerRequests.clear();
        if (next != null && !next.isEmpty()) {
            recyclerRequests.addAll(next);
        }
    }

    public NutriflowCreditsPayloadDTO getCredits() {
        NutriflowCreditsPayloadDTO snapshot = recyclerCredits.get();
        NutriflowCreditsPayloadDTO copy = new NutriflowCreditsPayloadDTO();
        List<CreditLedgerEntryDTO> ledger = snapshot.getLedger();
        if (ledger != null) {
            copy.setLedger(new ArrayList<>(ledger));
        }
        return copy;
    }

    public void replaceCredits(NutriflowCreditsPayloadDTO next) {
        NutriflowCreditsPayloadDTO safe =
            next != null ? deepCopy(next) : emptyCreditsPayload();
        recyclerCredits.set(safe);
    }

    private static NutriflowCreditsPayloadDTO emptyCreditsPayload() {
        NutriflowCreditsPayloadDTO p = new NutriflowCreditsPayloadDTO();
        p.setLedger(new ArrayList<>());
        return p;
    }

    private static NutriflowCreditsPayloadDTO deepCopy(NutriflowCreditsPayloadDTO src) {
        NutriflowCreditsPayloadDTO p = new NutriflowCreditsPayloadDTO();
        List<CreditLedgerEntryDTO> in = src.getLedger();
        if (in == null) {
            p.setLedger(new ArrayList<>());
            return p;
        }
        List<CreditLedgerEntryDTO> out = new ArrayList<>();
        for (CreditLedgerEntryDTO e : in) {
            if (e == null) {
                continue;
            }
            CreditLedgerEntryDTO c = new CreditLedgerEntryDTO();
            c.setId(e.getId());
            c.setUserKey(e.getUserKey());
            c.setRequestId(e.getRequestId());
            c.setAmount(e.getAmount());
            c.setCreatedAt(e.getCreatedAt());
            c.setNote(e.getNote());
            out.add(c);
        }
        p.setLedger(out);
        return p;
    }
}
