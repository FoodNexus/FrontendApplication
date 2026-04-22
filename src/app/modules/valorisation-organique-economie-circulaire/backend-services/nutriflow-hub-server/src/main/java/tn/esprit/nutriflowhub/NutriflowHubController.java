package tn.esprit.nutriflowhub;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stockage fichier JSON partagé pour que plusieurs navigateurs / utilisateurs voient les mêmes
 * lots donateur, demandes recycleur et crédits (démo sans base SQL).
 */
@RestController
@RequestMapping("/api/nutriflow")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class NutriflowHubController {

  private static final Path DATA_DIR = Path.of("nutriflow-hub-data");

  @PostConstruct
  public void init() throws IOException {
    Files.createDirectories(DATA_DIR);
  }

  @GetMapping(value = "/donor-lots", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> getDonorLots() throws IOException {
    return ResponseEntity.ok(readOrDefault("donor-lots.json", "[]"));
  }

  @PutMapping(value = "/donor-lots", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Void> putDonorLots(@RequestBody String body) throws IOException {
    write("donor-lots.json", body);
    return ResponseEntity.ok().build();
  }

  @GetMapping(value = "/recycler-requests", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> getRecyclerRequests() throws IOException {
    return ResponseEntity.ok(readOrDefault("recycler-requests.json", "[]"));
  }

  @PutMapping(value = "/recycler-requests", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Void> putRecyclerRequests(@RequestBody String body) throws IOException {
    write("recycler-requests.json", body);
    return ResponseEntity.ok().build();
  }

  @GetMapping(value = "/recycler-credits", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> getRecyclerCredits() throws IOException {
    return ResponseEntity.ok(readOrDefault("recycler-credits.json", "{\"ledger\":[]}"));
  }

  @PutMapping(value = "/recycler-credits", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Void> putRecyclerCredits(@RequestBody String body) throws IOException {
    write("recycler-credits.json", body);
    return ResponseEntity.ok().build();
  }

  private String readOrDefault(String name, String defaultJson) throws IOException {
    Path p = DATA_DIR.resolve(name);
    if (!Files.exists(p)) {
      return defaultJson;
    }
    return Files.readString(p, StandardCharsets.UTF_8);
  }

  private void write(String name, String body) throws IOException {
    Files.createDirectories(DATA_DIR);
    Files.writeString(
        DATA_DIR.resolve(name),
        body,
        StandardCharsets.UTF_8,
        StandardOpenOption.CREATE,
        StandardOpenOption.TRUNCATE_EXISTING,
        StandardOpenOption.WRITE);
  }
}
