package uk.ac.ebi.biostudies.integration;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import uk.ac.ebi.biostudies.integration.utils.IntegrationTestProperties;
import uk.ac.ebi.biostudies.integration.utils.IntegrationConfig;

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {IntegrationConfig.class})
public class BrowseTest {
    @Autowired
    IntegrationTestProperties props;

    @Test
    public void testIndex() {
        IntegrationTestSuite.driver.navigate().to(props.getBaseUrl());
        WebDriverWait wait = new WebDriverWait(IntegrationTestSuite.driver, 10);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#fileCount")));
        assertTrue(IntegrationTestSuite.driver.getTitle().equals("BioStudies < EMBL-EBI"));
    }

    @Test
    public void testLoginAndLogout() {
        IntegrationTestSuite.driver.navigate().to(props.getBaseUrl());
        WebDriverWait wdw = new WebDriverWait(IntegrationTestSuite.driver, 20);
        wdw.until((ExpectedCondition<Boolean>) d -> {
            String result = d.findElement(By.id("fileCount")).getText();
            return result.length() > 0;
        });
        IntegrationTestSuite.driver.findElement(By.cssSelector("#login-button")).click();
        WebDriverWait wait = new WebDriverWait(IntegrationTestSuite.driver, 10);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#user-field")));
        IntegrationTestSuite.driver.findElement(By.cssSelector("#user-field")).sendKeys(props.getUsername());
        IntegrationTestSuite.driver.findElement(By.cssSelector("#pass-field")).sendKeys(props.getPassword());
        IntegrationTestSuite.driver.findElement(By.cssSelector("input[type='submit'].submit")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#logout-button")));
        assertTrue(IntegrationTestSuite.driver.findElement(By.cssSelector("#logout-button")).getAttribute("innerText").trim().length() > "Logout ".length());
        IntegrationTestSuite.driver.findElement(By.cssSelector("#logout-button")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#login-button")));
        assertEquals("Login", IntegrationTestSuite.driver.findElement(By.cssSelector("#login-button")).getAttribute("innerText").trim());
    }

}
