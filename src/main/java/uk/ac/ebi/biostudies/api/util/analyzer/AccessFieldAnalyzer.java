/*
 * Copyright 2009-2016 European Molecular Biology Laboratory
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package uk.ac.ebi.biostudies.api.util.analyzer;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.StopFilter;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.Tokenizer;
import org.apache.lucene.analysis.miscellaneous.ASCIIFoldingFilter;
import org.apache.lucene.analysis.util.CharTokenizer;
import uk.ac.ebi.biostudies.config.IndexConfig;

public final class AccessFieldAnalyzer extends Analyzer {
    @Override
    protected TokenStreamComponents createComponents(String fieldName) {
        Tokenizer source = new AccessFieldAnalyzerTextTokenizer();
        TokenStream filter = new StopFilter(new ASCIIFoldingFilter(source), IndexConfig.STOP_WORDS);
        return new TokenStreamComponents(source, filter);
    }

    private static class AccessFieldAnalyzerTextTokenizer extends CharTokenizer {
        @Override
        protected boolean isTokenChar(int c) {
            return Character.isLetter(c) | Character.isDigit(c) | c=='@' | c=='.' | c=='~' | c=='#'| c=='-' | c=='_';
        }

        @Override
        protected int normalize(int c) {
            return Character.toLowerCase(c);
        }
    }
}
